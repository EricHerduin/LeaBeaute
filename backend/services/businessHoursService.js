function createBusinessHoursService(deps) {
  const {
    readOne,
    readRows,
    runSql,
    sqlJson,
    sqlValue,
    sqlBool,
    parseJson,
    defaultBusinessHours,
    isCurrentlyOpen,
  } = deps;

  function normalizeDayHours(hours = null) {
    if (!hours) {
      return {
        morningOpen: null,
        morningClose: null,
        afternoonOpen: null,
        afternoonClose: null,
      };
    }

    return {
      morningOpen: hours.morningOpen ?? hours.open ?? null,
      morningClose: hours.morningClose ?? null,
      afternoonOpen: hours.afternoonOpen ?? null,
      afternoonClose: hours.afternoonClose ?? hours.close ?? null,
    };
  }

  function normalizeSchedule(schedule = {}) {
    const normalized = {};
    for (let dayIndex = 0; dayIndex <= 6; dayIndex += 1) {
      normalized[String(dayIndex)] = normalizeDayHours(schedule[String(dayIndex)] ?? schedule[dayIndex] ?? null);
    }
    return normalized;
  }

  function getDayIntervals(dayHours) {
    const normalized = normalizeDayHours(dayHours);
    const intervals = [];

    if (normalized.morningOpen && normalized.morningClose) {
      intervals.push({ open: normalized.morningOpen, close: normalized.morningClose });
    }

    if (normalized.afternoonOpen && normalized.afternoonClose) {
      intervals.push({ open: normalized.afternoonOpen, close: normalized.afternoonClose });
    }

    return intervals;
  }

  function getFirstOpening(dayHours) {
    const intervals = getDayIntervals(dayHours);
    return intervals[0]?.open || null;
  }

  function getLastClosing(dayHours) {
    const intervals = getDayIntervals(dayHours);
    return intervals[intervals.length - 1]?.close || null;
  }

  function getCurrentOrNextInterval(dayHours) {
    const intervals = getDayIntervals(dayHours);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const interval of intervals) {
      const openMinutes = Number.parseInt(interval.open.slice(0, 2), 10) * 60 + Number.parseInt(interval.open.slice(3, 5), 10);
      const closeMinutes = Number.parseInt(interval.close.slice(0, 2), 10) * 60 + Number.parseInt(interval.close.slice(3, 5), 10);

      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return { type: "current", interval };
      }

      if (currentMinutes < openMinutes) {
        return { type: "next", interval };
      }
    }

    return null;
  }

  return {
    getBusinessHours() {
      const general = readOne("SELECT * FROM business_hours_general WHERE config_id = 'main' LIMIT 1;");
      if (!general) {
        return defaultBusinessHours;
      }
      return normalizeSchedule(parseJson(general.schedule_json, defaultBusinessHours));
    },

    saveBusinessHours(schedule) {
      const normalizedSchedule = normalizeSchedule(schedule);
      runSql(`
        INSERT INTO business_hours_general (config_id, schedule_json, updated_at)
        VALUES ('main', ${sqlJson(normalizedSchedule)}, CURRENT_TIMESTAMP)
        ON CONFLICT(config_id) DO UPDATE SET
          schedule_json = excluded.schedule_json,
          updated_at = CURRENT_TIMESTAMP;
      `);
      return { success: true };
    },

    listExceptions() {
      return readRows("SELECT * FROM business_hours_exceptions ORDER BY date ASC;").map((row) => ({
        date: row.date,
        endDate: row.end_date,
        isOpen: Boolean(row.is_open),
        startTime: row.start_time,
        endTime: row.end_time,
        reason: row.reason || "",
      }));
    },

    saveException(body) {
      if (!body.date) {
        const error = new Error("date field required");
        error.status = 400;
        throw error;
      }

      runSql(`
        INSERT INTO business_hours_exceptions (
          date, end_date, is_open, start_time, end_time, reason, updated_at
        ) VALUES (
          ${sqlValue(body.date)},
          ${sqlValue(body.endDate || null)},
          ${sqlBool(body.isOpen ?? true)},
          ${sqlValue(body.startTime || null)},
          ${sqlValue(body.endTime || null)},
          ${sqlValue(body.reason || "")},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT(date) DO UPDATE SET
          end_date = excluded.end_date,
          is_open = excluded.is_open,
          start_time = excluded.start_time,
          end_time = excluded.end_time,
          reason = excluded.reason,
          updated_at = CURRENT_TIMESTAMP;
      `);

      return { success: true };
    },

    deleteException(date) {
      const existing = readOne(`SELECT date FROM business_hours_exceptions WHERE date = ${sqlValue(date)} LIMIT 1;`);
      if (!existing) {
        return false;
      }
      runSql(`DELETE FROM business_hours_exceptions WHERE date = ${sqlValue(date)};`);
      return true;
    },

    listHolidays() {
      return readRows("SELECT * FROM business_hours_holidays ORDER BY date ASC;").map((row) => ({
        date: row.date,
        name: row.name,
        isClosed: Boolean(row.is_closed),
      }));
    },

    saveHoliday(body) {
      if (!body.date || !body.name) {
        const error = new Error("date and name fields required");
        error.status = 400;
        throw error;
      }

      runSql(`
        INSERT INTO business_hours_holidays (
          date, name, is_closed, updated_at
        ) VALUES (
          ${sqlValue(body.date)},
          ${sqlValue(body.name)},
          ${sqlBool(body.isClosed ?? true)},
          CURRENT_TIMESTAMP
        )
        ON CONFLICT(date) DO UPDATE SET
          name = excluded.name,
          is_closed = excluded.is_closed,
          updated_at = CURRENT_TIMESTAMP;
      `);

      return { success: true };
    },

    deleteHoliday(date) {
      const existing = readOne(`SELECT date FROM business_hours_holidays WHERE date = ${sqlValue(date)} LIMIT 1;`);
      if (!existing) {
        return false;
      }
      runSql(`DELETE FROM business_hours_holidays WHERE date = ${sqlValue(date)};`);
      return true;
    },

    getStatus() {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const dayKey = String((now.getDay() + 0) % 7);

      const holiday = readOne(`SELECT * FROM business_hours_holidays WHERE date = ${sqlValue(todayStr)} LIMIT 1;`);
      if (holiday?.is_closed) {
        return {
          status: "closed",
          message: `Fermé - ${holiday.name}`,
          hours: null,
        };
      }

      const exception = readOne(`SELECT * FROM business_hours_exceptions WHERE date = ${sqlValue(todayStr)} LIMIT 1;`);
      if (exception) {
        if (!exception.is_open) {
          return {
            status: "closed",
            message: `Fermé - ${exception.reason || "Exception"}`,
            hours: null,
          };
        }

        const hours = {
          open: exception.start_time,
          close: exception.end_time,
        };

        return {
          status: isCurrentlyOpen(hours) ? "open" : "closed",
          message: `Horaires modifiés - ${exception.reason || "Exception"}`,
          hours,
        };
      }

      const general = readOne("SELECT schedule_json FROM business_hours_general WHERE config_id = 'main' LIMIT 1;");
      const schedule = general ? normalizeSchedule(parseJson(general.schedule_json, defaultBusinessHours)) : defaultBusinessHours;
      const dayHours = schedule[dayKey];
      const intervals = getDayIntervals(dayHours);

      if (intervals.length === 0) {
        return {
          status: "closed",
          message: "Fermé aujourd'hui",
          hours: null,
        };
      }

      const intervalState = getCurrentOrNextInterval(dayHours);
      const firstOpening = getFirstOpening(dayHours);
      const lastClosing = getLastClosing(dayHours);

      if (intervalState?.type === "current") {
        return {
          status: "open",
          message: `Ouvert jusqu'à ${intervalState.interval.close}`,
          hours: intervalState.interval,
          dayHours,
        };
      }

      if (intervalState?.type === "next") {
        return {
          status: "closed",
          message: `Ouvre à ${intervalState.interval.open}`,
          hours: { open: firstOpening, close: lastClosing },
          nextInterval: intervalState.interval,
          dayHours,
        };
      }

      return {
        status: "closed",
        message: "Fermé actuellement",
        hours: { open: firstOpening, close: lastClosing },
        dayHours,
      };
    },
  };
}

module.exports = {
  createBusinessHoursService,
};
