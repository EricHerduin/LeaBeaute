from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import stripe
from stripe import error as stripe_error
import secrets
import string
import httpx
from email_service import send_gift_card_email, generate_gift_card_email_html

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe
stripe_api_key = os.environ.get('STRIPE_API_KEY')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class PriceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str
    name: str
    priceEur: Optional[float] = None
    durationMin: Optional[int] = None
    note: Optional[str] = None
    isActive: bool = True
    sortOrder: int = 0

class PriceItemUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    priceEur: Optional[float] = None
    durationMin: Optional[int] = None
    note: Optional[str] = None
    isActive: Optional[bool] = None
    sortOrder: Optional[int] = None

class GiftCard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: Optional[str] = None
    amountEur: float
    status: str = "pending"  # pending|active|failed|canceled|expired|redeemed
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expiresAt: Optional[datetime] = None
    stripeSessionId: Optional[str] = None
    buyer_firstname: str
    buyer_lastname: str
    buyer_email: str
    buyer_phone: str
    recipient_name: Optional[str] = None
    personal_message: Optional[str] = None
    stripePaymentIntentId: Optional[str] = None

class AdminLogin(BaseModel):
    password: str

class AdminLoginResponse(BaseModel):
    success: bool
    token: Optional[str] = None

class CreateCheckoutRequest(BaseModel):
    amount: float
    origin_url: str
    buyer_firstname: str
    buyer_lastname: str
    buyer_email: str
    buyer_phone: str
    recipient_name: Optional[str] = None
    personal_message: Optional[str] = None
    coupon_token: Optional[str] = None

class GiftCardStatusResponse(BaseModel):
    found: bool
    code: Optional[str] = None
    amountEur: Optional[float] = None
    status: Optional[str] = None
    expiresAt: Optional[str] = None

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    type: str  # "percentage" or "fixed"
    value: float  # percentage (0-100) or fixed amount
    currency: str = "EUR"
    validFrom: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    validTo: datetime
    isActive: bool = True
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    maxUses: Optional[int] = None
    currentUses: int = 0

class CouponUsage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    coupon_code: str
    session_id: Optional[str] = None  # Stripe session ID
    gift_card_id: Optional[str] = None
    validation_token: str  # Unique token to prevent duplicate usage
    status: str = "pending"  # pending|applied|canceled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    applied_at: Optional[datetime] = None

class CouponCreate(BaseModel):
    code: str
    type: str
    value: float
    validTo: str  # ISO format date string
    isActive: bool = True
    maxUses: Optional[int] = None

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[str] = None
    value: Optional[float] = None
    validTo: Optional[str] = None
    isActive: Optional[bool] = None
    maxUses: Optional[int] = None

class TestimonialCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=10, max_length=600)
    service: Optional[str] = None
    allowDisplay: bool = True

class DailyHours(BaseModel):
    """Horaires pour un jour"""
    open: Optional[str] = None  # HH:MM format
    close: Optional[str] = None  # HH:MM format
    isClosed: bool = False

class BusinessHoursGeneral(BaseModel):
    """Horaires généraux par jour de la semaine"""
    model_config = ConfigDict(extra="allow")
    monday: Optional[DailyHours] = None
    tuesday: Optional[DailyHours] = None
    wednesday: Optional[DailyHours] = None
    thursday: Optional[DailyHours] = None
    friday: Optional[DailyHours] = None
    saturday: Optional[DailyHours] = None
    sunday: Optional[DailyHours] = None

class BusinessHoursException(BaseModel):
    """Exception pour une date ou période spécifique"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    startDate: str  # YYYY-MM-DD
    endDate: Optional[str] = None  # YYYY-MM-DD (si None = date unique)
    hours: Optional[DailyHours] = None  # Si None = fermé ce jour/période
    reason: Optional[str] = None  # Ex: "Vacances annuelles", "Journée portes ouvertes"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Holiday(BaseModel):
    """Jour férié"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    name: str
    isClosed: bool = True
    hours: Optional[DailyHours] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ SEED DATA ============

PRICE_ITEMS_SEED = [
  {"category":"Epilations","name":"Sourcils","priceEur":11,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Epilations","name":"Lèvre","priceEur":7,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Epilations","name":"Menton","priceEur":10,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Epilations","name":"Joues","priceEur":11,"durationMin":None,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Epilations","name":"Sourcils + Lèvre + Menton","priceEur":25,"durationMin":None,"note":None,"isActive":True,"sortOrder":50},
  {"category":"Epilations","name":"Demi-jambes","priceEur":26,"durationMin":None,"note":None,"isActive":True,"sortOrder":60},
  {"category":"Epilations","name":"Maillot","priceEur":18,"durationMin":None,"note":None,"isActive":True,"sortOrder":70},
  {"category":"Epilations","name":"Maillot échancré","priceEur":23,"durationMin":None,"note":None,"isActive":True,"sortOrder":80},
  {"category":"Epilations","name":"Maillot intégral","priceEur":28,"durationMin":None,"note":None,"isActive":True,"sortOrder":90},
  {"category":"Epilations","name":"Aisselles","priceEur":14,"durationMin":None,"note":None,"isActive":True,"sortOrder":100},
  {"category":"Epilations","name":"Cuisses","priceEur":28,"durationMin":None,"note":None,"isActive":True,"sortOrder":110},
  {"category":"Epilations","name":"Arrières cuisses","priceEur":16,"durationMin":None,"note":None,"isActive":True,"sortOrder":120},
  {"category":"Epilations","name":"Jambes entières","priceEur":36,"durationMin":None,"note":None,"isActive":True,"sortOrder":130},
  {"category":"Epilations","name":"Fesses","priceEur":10,"durationMin":None,"note":None,"isActive":True,"sortOrder":140},
  {"category":"Epilations","name":"Bras","priceEur":20,"durationMin":None,"note":None,"isActive":True,"sortOrder":150},
  {"category":"Epilations","name":"Mains","priceEur":12,"durationMin":None,"note":None,"isActive":True,"sortOrder":160},
  {"category":"Forfaits épilations","name":"Demi-jambes + Aisselles","priceEur":36,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Forfaits épilations","name":"Demi-jambes + Maillot","priceEur":40,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Forfaits épilations","name":"Demi-jambes + Maillot + Aisselles","priceEur":54,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Forfaits épilations","name":"Jambes entières + Aisselles","priceEur":46,"durationMin":None,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Forfaits épilations","name":"Jambes entières + Maillot","priceEur":50,"durationMin":None,"note":None,"isActive":True,"sortOrder":50},
  {"category":"Forfaits épilations","name":"Jambes entières + Aisselles + Maillot","priceEur":62,"durationMin":None,"note":None,"isActive":True,"sortOrder":60},
  {"category":"Mains","name":"Manucure","priceEur":22,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Mains","name":"Pose de semi-permanent","priceEur":30,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Mains","name":"French","priceEur":35,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Mains","name":"Pose de vernis","priceEur":12,"durationMin":None,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Mains","name":"Beauté des mains","priceEur":40,"durationMin":None,"note":None,"isActive":True,"sortOrder":50},
  {"category":"Mains","name":"Beauté des mains + paraffine","priceEur":55,"durationMin":None,"note":None,"isActive":True,"sortOrder":60},
  {"category":"Pieds","name":"Beauté de pieds flash","priceEur":25,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Pieds","name":"Soin peeling rénovateur des pieds (Guinot)","priceEur":50,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Pieds","name":"Soin des pieds + paraffine","priceEur":70,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Maquillage","name":"Maquillage jour","priceEur":28,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Maquillage","name":"Maquillage soir","priceEur":38,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Maquillage","name":"Forfait mariée","priceEur":50,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Maquillage","name":"3 cours d'auto maquillage","priceEur":80,"durationMin":None,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Extensions de cils","name":"1ère pose","priceEur":85,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Extensions de cils","name":"Remplissage 2 semaines","priceEur":48,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Extensions de cils","name":"Remplissage 3 semaines","priceEur":58,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Extensions de cils","name":"Remplissage 4 semaines","priceEur":68,"durationMin":None,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Autres soins","name":"Strass dentaire","priceEur":35,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Autres soins","name":"Teinture de sourcils","priceEur":10,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Autres soins","name":"Teinture de cils","priceEur":20,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"YUMI","name":"Réhaussement et soin des cils avec teinture","priceEur":70,"durationMin":None,"note":"En duo : 60 €","isActive":True,"sortOrder":10},
  {"category":"YUMI","name":"Browlift","priceEur":45,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"YUMI","name":"Réhaussement + Browlift","priceEur":105,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Électrolyse","name":"15 min","priceEur":35,"durationMin":15,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Électrolyse","name":"30 min","priceEur":70,"durationMin":30,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Épilation lumière pulsée","name":"Épilation lumière pulsée","priceEur":None,"durationMin":None,"note":"Demandez les tarifs","isActive":True,"sortOrder":10},
  {"category":"LPG","name":"Le body","priceEur":16,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"LPG","name":"La séance","priceEur":55,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"LPG","name":"Forfait 10 séances + 1 offerte","priceEur":550,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"LPG","name":"Séance d'entretien","priceEur":49,"durationMin":None,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Pressothérapie","name":"Jambes ou ventre (20 min)","priceEur":25,"durationMin":20,"note":"Soin jambes lourdes, anti-cellulite, récupération sportive","isActive":True,"sortOrder":10},
  {"category":"UV","name":"Séance UV","priceEur":13,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"UV","name":"Lunettes obligatoires","priceEur":6,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Guinot - Soins visage","name":"Hydradermie 1000 (60 min)","priceEur":100,"durationMin":60,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Guinot - Soins visage","name":"Hydradermie jeunesse 1000 (60 min)","priceEur":120,"durationMin":60,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Guinot - Soins visage","name":"Hydradermie 1000 Lift (60 min)","priceEur":140,"durationMin":60,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Guinot - Soins visage","name":"Lift summum (60 min)","priceEur":120,"durationMin":60,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Guinot - Soins visage","name":"Age summum (60 min)","priceEur":130,"durationMin":60,"note":None,"isActive":True,"sortOrder":50},
  {"category":"Guinot - Soins visage","name":"Hydra Peeling (60 min)","priceEur":100,"durationMin":60,"note":None,"isActive":True,"sortOrder":60},
  {"category":"Guinot - Soins visage","name":"Hydra summum (60 min)","priceEur":110,"durationMin":60,"note":None,"isActive":True,"sortOrder":70},
  {"category":"Guinot - Soins visage","name":"Détox Oxygénant (45 min)","priceEur":90,"durationMin":45,"note":None,"isActive":True,"sortOrder":80},
  {"category":"Guinot - Soins visage","name":"Douceur hydra beauté (45 min)","priceEur":50,"durationMin":45,"note":None,"isActive":True,"sortOrder":90},
  {"category":"Guinot - Soins visage","name":"Soin hydra-sensitive (45 min)","priceEur":58,"durationMin":45,"note":None,"isActive":True,"sortOrder":100},
  {"category":"Guinot - Soins visage","name":"Soin visage anti-fatigue (50 min)","priceEur":60,"durationMin":50,"note":None,"isActive":True,"sortOrder":110},
  {"category":"Guinot - Soins visage","name":"Soin fermeté (50 min)","priceEur":75,"durationMin":50,"note":None,"isActive":True,"sortOrder":120},
  {"category":"Guinot - Soins visage","name":"Soin visage anti-rides (50 min)","priceEur":65,"durationMin":50,"note":None,"isActive":True,"sortOrder":130},
  {"category":"Guinot - Soins visage","name":"Soin équilibre pureté (45 min)","priceEur":65,"durationMin":45,"note":None,"isActive":True,"sortOrder":140},
  {"category":"Guinot - Soins visage","name":"Eye lift (40 min)","priceEur":75,"durationMin":40,"note":None,"isActive":True,"sortOrder":150},
  {"category":"Guinot - Soins visage","name":"Soin express (30 min)","priceEur":35,"durationMin":30,"note":None,"isActive":True,"sortOrder":160},
  {"category":"Guinot - Soins visage","name":"Soin du visage de Léa (75 min)","priceEur":120,"durationMin":75,"note":"Personnalisé expert luminothérapie","isActive":True,"sortOrder":170},
  {"category":"Soins corps","name":"Gommage corps (30 min)","priceEur":45,"durationMin":30,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Soins corps","name":"Modelage corps (50 min)","priceEur":70,"durationMin":50,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Soins corps","name":"Modelage corps (30 min)","priceEur":50,"durationMin":30,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Soins corps spécifiques","name":"Rêve de détente (60 min)","priceEur":78,"durationMin":60,"note":"Gommage + modelage","isActive":True,"sortOrder":10},
  {"category":"Soins corps spécifiques","name":"Rêve de détente du dos (45 min)","priceEur":60,"durationMin":45,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Soins corps spécifiques","name":"Rêve de détente du dos à la bougie (45 min)","priceEur":70,"durationMin":45,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Soins corps spécifiques","name":"Rêve de détente future maman (75 min)","priceEur":90,"durationMin":75,"note":None,"isActive":True,"sortOrder":40},
  {"category":"Soins corps spécifiques","name":"Rêve de détente absolue (90 min)","priceEur":120,"durationMin":90,"note":"Gommage, modelage, enveloppement","isActive":True,"sortOrder":50},
  {"category":"Soins corps spécifiques","name":"Rêve de gambettes sucrées (20 min)","priceEur":35,"durationMin":20,"note":None,"isActive":True,"sortOrder":60},
  {"category":"Soins corps spécifiques","name":"Soin en duo","priceEur":None,"durationMin":None,"note":"Demandez les tarifs","isActive":True,"sortOrder":70},
  {"category":"Visible Age Reverse","name":"1 soin (30 min)","priceEur":130,"durationMin":30,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Visible Age Reverse","name":"Cure de 4 soins","priceEur":455,"durationMin":None,"note":"Au lieu de 520 € (65 € offerts)","isActive":True,"sortOrder":20},
  {"category":"Visible Age Reverse","name":"Séance d'entretien","priceEur":100,"durationMin":None,"note":None,"isActive":True,"sortOrder":30},
  {"category":"Le Tan","name":"Visage cou décolleté","priceEur":15,"durationMin":None,"note":None,"isActive":True,"sortOrder":10},
  {"category":"Le Tan","name":"Visage cou décolleté + bras","priceEur":25,"durationMin":None,"note":None,"isActive":True,"sortOrder":20},
  {"category":"Le Tan","name":"Corps entier","priceEur":45,"durationMin":None,"note":None,"isActive":True,"sortOrder":30}
]

async def seed_database():
    count = await db.price_items.count_documents({})
    if count == 0:
        for item_data in PRICE_ITEMS_SEED:
            item = PriceItem(**item_data)
            doc = item.model_dump()
            await db.price_items.insert_one(doc)
        logging.info(f"Seeded {len(PRICE_ITEMS_SEED)} price items")

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Léa Beauté Valognes API"}

# Prices endpoints
@api_router.get("/prices", response_model=List[PriceItem])
async def get_prices():
    """Get all active price items"""
    prices = await db.price_items.find({"isActive": True}, {"_id": 0}).to_list(1000)
    return sorted(prices, key=lambda x: (x['category'], x['sortOrder']))

@api_router.get("/prices/all", response_model=List[PriceItem])
async def get_all_prices(authorization: str = Header(None)):
    """Admin: Get all price items"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    prices = await db.price_items.find({}, {"_id": 0}).to_list(1000)
    return sorted(prices, key=lambda x: (x['category'], x['sortOrder']))

@api_router.post("/prices", response_model=PriceItem)
async def create_price(item: PriceItem, authorization: str = Header(None)):
    """Admin: Create new price item"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    doc = item.model_dump()
    await db.price_items.insert_one(doc)
    return item

@api_router.put("/prices/{item_id}", response_model=PriceItem)
async def update_price(item_id: str, update: PriceItemUpdate, authorization: str = Header(None)):
    """Admin: Update price item"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.price_items.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Price item not found")
    
    updated_item = await db.price_items.find_one({"id": item_id}, {"_id": 0})
    if not updated_item:
        raise HTTPException(status_code=404, detail="Price item not found")
    return PriceItem(**updated_item)

@api_router.delete("/prices/{item_id}")
async def delete_price(item_id: str, authorization: str = Header(None)):
    """Admin: Delete price item"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    result = await db.price_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Price item not found")
    return {"success": True}

# Admin auth
@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    if credentials.password == ADMIN_PASSWORD:
        return AdminLoginResponse(success=True, token=ADMIN_PASSWORD)
    raise HTTPException(status_code=401, detail="Invalid password")

# Gift cards endpoints
GIFT_CARD_MIN_AMOUNT = 10.0
GIFT_CARD_MAX_AMOUNT = 500.0

def generate_gift_code():
    """Generate unique gift card code LB-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    part1 = ''.join(secrets.choice(chars) for _ in range(4))
    part2 = ''.join(secrets.choice(chars) for _ in range(4))
    return f"LB-{part1}-{part2}"

@api_router.post("/gift-cards/create-checkout")
async def create_gift_card_checkout(request: CreateCheckoutRequest):
    """Create Stripe checkout session for gift card"""
    if not stripe_api_key:
        raise HTTPException(
            status_code=501,
            detail="Stripe API key not configured.",
        )
    
    # Validate amount
    if request.amount < GIFT_CARD_MIN_AMOUNT or request.amount > GIFT_CARD_MAX_AMOUNT:
        raise HTTPException(status_code=400, detail="Invalid gift card amount")
    
    # Validate coupon token if provided
    coupon_data = None
    final_amount = request.amount
    coupon_token = None
    
    if request.coupon_token:
        coupon_usage = await db.coupon_usages.find_one({"validation_token": request.coupon_token})
        
        if not coupon_usage:
            raise HTTPException(status_code=400, detail="Invalid coupon token")
        
        # Token MUST be in pending state - if already applied or canceled, reject
        if coupon_usage.get('status') != 'pending':
            raise HTTPException(status_code=400, detail="Coupon already used or invalid")
        
        # Get coupon details
        coupon = await db.coupons.find_one({"code": coupon_usage['coupon_code']})
        if not coupon:
            raise HTTPException(status_code=400, detail="Coupon not found")
        
        # Calculate final amount
        if coupon['type'] == 'percentage':
            discount = (request.amount * coupon['value']) / 100
            final_amount = max(0, request.amount - discount)
        else:  # fixed
            final_amount = max(0, request.amount - coupon['value'])
        
        coupon_data = {
            "code": coupon['code'],
            "type": coupon['type'],
            "value": coupon['value'],
            "discount_amount": request.amount - final_amount
        }
        coupon_token = request.coupon_token
        
        # Mark coupon usage as "applied-pending" (will be finalized after payment)
        # This prevents the same token from being used in another checkout
        await db.coupon_usages.update_one(
            {"validation_token": coupon_token},
            {"$set": {"status": "applied-pending"}}
        )
    
    # Create gift card record with buyer info
    gift_card = GiftCard(
        amountEur=final_amount,  # Store final amount after discount
        status="pending",
        buyer_firstname=request.buyer_firstname,
        buyer_lastname=request.buyer_lastname,
        buyer_email=request.buyer_email,
        buyer_phone=request.buyer_phone,
        recipient_name=request.recipient_name,
        personal_message=request.personal_message
    )
    doc = gift_card.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    doc['coupon_token'] = coupon_token  # Store coupon token for later verification
    doc['original_amount'] = request.amount  # Store original amount before discount
    await db.gift_cards.insert_one(doc)
    
    # Configure Stripe
    stripe.api_key = stripe_api_key
    
    try:
        # Create checkout session using Stripe SDK
        success_url = f"{request.origin_url}/gift-card-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{request.origin_url}/#cartes-cadeaux"
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'Carte cadeau Léa Beauté {request.amount}€',
                        'description': 'Carte cadeau valable 2 ans',
                    },
                    'unit_amount': int(final_amount * 100),  # amount in cents (after discount)
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                'gift_card_id': gift_card.id,
                'amount_eur': str(final_amount),
                'original_amount_eur': str(request.amount),
                'coupon_code': coupon_data['code'] if coupon_data else ""
            }
        )
        
        # Update gift card with session ID
        await db.gift_cards.update_one(
            {"id": gift_card.id},
            {"$set": {"stripeSessionId": session.id}}
        )
        
        # Create payment transaction
        transaction = {
            "id": str(uuid.uuid4()),
            "gift_card_id": gift_card.id,
            "session_id": session.id,
            "amount": final_amount,
            "original_amount": request.amount,
            "currency": "eur",
            "status": "pending",
            "payment_status": "pending",
            "coupon_token": coupon_token,
            "coupon_data": coupon_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "metadata": {"gift_card_id": gift_card.id}
        }
        await db.payment_transactions.insert_one(transaction)
        
        return {"url": session.url, "session_id": session.id}
    
    except stripe_error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        # Clean up if Stripe fails
        await db.gift_cards.delete_one({"id": gift_card.id})
        if coupon_token:
            # Revert coupon usage back to pending
            await db.coupon_usages.update_one(
                {"validation_token": coupon_token},
                {"$set": {"status": "pending"}}
            )
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating checkout: {str(e)}")
        # Clean up gift card if checkout creation failed
        await db.gift_cards.delete_one({"id": gift_card.id})
        if coupon_token:
            # Revert coupon usage back to pending
            await db.coupon_usages.update_one(
                {"validation_token": coupon_token},
                {"$set": {"status": "pending"}}
            )
        raise HTTPException(status_code=500, detail="Error creating checkout session")

@api_router.get("/gift-cards/status/{session_id}")
async def get_gift_card_status(session_id: str):
    """Poll gift card payment status"""
    if not stripe_api_key:
        raise HTTPException(
            status_code=501,
            detail="Stripe API key not configured.",
        )
    
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.get("payment_status") == "paid":
        gift_card = await db.gift_cards.find_one({"id": transaction["gift_card_id"]}, {"_id": 0})
        return {
            "payment_status": "paid",
            "status": "complete",
            "gift_card": gift_card
        }
    
    try:
        # Configure Stripe and get session
        stripe.api_key = stripe_api_key
        session = stripe.checkout.Session.retrieve(session_id)
        
        payment_status = "pending"
        if session.payment_status == "paid":
            payment_status = "paid"
        elif session.payment_status == "unpaid":
            payment_status = "unpaid"
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": payment_status, "status": session.status}}
        )
        
        # If paid and not yet processed
        if payment_status == "paid" and transaction.get("payment_status") != "paid":
            gift_card_id = transaction["gift_card_id"]
            code = generate_gift_code()
            expires_at = datetime.now(timezone.utc) + timedelta(days=730)  # 2 years
            
            # Finalize coupon usage if present
            if transaction.get("coupon_token"):
                coupon_usage = await db.coupon_usages.find_one(
                    {"validation_token": transaction["coupon_token"]}
                )
                
                if coupon_usage:
                    # Update from applied-pending to applied
                    await db.coupon_usages.update_one(
                        {"validation_token": transaction["coupon_token"]},
                        {"$set": {
                            "status": "applied",
                            "session_id": session_id,
                            "applied_at": datetime.now(timezone.utc).isoformat(),
                            "gift_card_id": gift_card_id
                        }}
                    )
                    
                    # Ensure currentUses is incremented (might not have been if checkout failed before)
                    if coupon_usage.get('status') in ['pending', 'applied-pending']:
                        await db.coupons.update_one(
                            {"code": coupon_usage['coupon_code']},
                            {"$inc": {"currentUses": 1}}
                        )
            
            await db.gift_cards.update_one(
                {"id": gift_card_id},
                {"$set": {
                    "code": code,
                    "status": "active",
                    "expiresAt": expires_at.isoformat()
                }}
            )
            
            # Fetch the updated gift card
            gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
            if not gift_card:
                raise HTTPException(status_code=500, detail="Gift card not found after payment")
            
            # Send email with gift card info
            buyer_name = f"{gift_card['buyer_firstname']} {gift_card['buyer_lastname']}"
            recipient_name = gift_card.get('recipient_name') or buyer_name
            await send_gift_card_email(
                to_email=gift_card['buyer_email'],
                recipient_name=recipient_name,
                gift_card_code=code,
                amount=gift_card['amountEur'],
                expires_at=expires_at.isoformat(),
                buyer_name=buyer_name
            )
            
            return {
                "payment_status": "paid",
                "status": "complete",
                "gift_card": gift_card
            }
        
        return {
            "payment_status": payment_status,
            "status": session.status,
            "gift_card": None
        }
    
    except stripe_error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting session status: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving payment status")

@api_router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    try:
        stripe.api_key = stripe_api_key
        event = stripe.Webhook.construct_event(
            body, signature, os.getenv("STRIPE_WEBHOOK_SECRET", "")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe_error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    try:
        # Handle checkout.session.completed event
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            session_id = session["id"]
            
            # Update transaction status
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}}
            )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Error handling webhook")

@api_router.get("/gift-cards/verify/{code}", response_model=GiftCardStatusResponse)
async def verify_gift_card(code: str):
    """Verify gift card code"""
    gift_card = await db.gift_cards.find_one({"code": code}, {"_id": 0})
    
    if not gift_card:
        return GiftCardStatusResponse(found=False)
    
    # Check if expired
    if gift_card.get("expiresAt"):
        expires_at = datetime.fromisoformat(gift_card["expiresAt"])
        if datetime.now(timezone.utc) > expires_at and gift_card["status"] == "active":
            await db.gift_cards.update_one({"code": code}, {"$set": {"status": "expired"}})
            gift_card["status"] = "expired"
    
    return GiftCardStatusResponse(
        found=True,
        code=gift_card["code"],
        amountEur=gift_card["amountEur"],
        status=gift_card["status"],
        expiresAt=gift_card.get("expiresAt")
    )

@api_router.post("/gift-cards/search")
async def search_gift_cards(query: str, search_type: str = "code"):
    """Search gift cards by code, recipient name, or buyer name (public endpoint)"""
    # search_type: "code", "recipient", or "buyer"
    
    if search_type == "code":
        gift_card = await db.gift_cards.find_one(
            {"code": query.upper()},
            {"_id": 0}
        )
        if not gift_card:
            return {"found": False, "results": []}
        return {
            "found": True,
            "results": [{
                "id": gift_card.get("id"),
                "code": gift_card.get("code"),
                "amountEur": gift_card.get("amountEur"),
                "status": gift_card.get("status"),
                "buyer_firstname": gift_card.get("buyer_firstname", ""),
                "buyer_lastname": gift_card.get("buyer_lastname", ""),
                "recipient_name": gift_card.get("recipient_name", ""),
                "expiresAt": gift_card.get("expiresAt"),
                "createdAt": gift_card.get("createdAt")
            }]
        }
    
    elif search_type == "recipient":
        gift_cards = await db.gift_cards.find(
            {
                "$or": [
                    {"recipient_name": {"$regex": query, "$options": "i"}},
                    {"buyer_firstname": {"$regex": query, "$options": "i"}},
                    {"buyer_lastname": {"$regex": query, "$options": "i"}}
                ]
            },
            {"_id": 0}
        ).to_list(100)
        
        if not gift_cards:
            return {"found": False, "results": []}
        
        return {
            "found": True,
            "results": [
                {
                    "id": gc.get("id"),
                    "code": gc.get("code"),
                    "amountEur": gc.get("amountEur"),
                    "status": gc.get("status"),
                    "buyer_firstname": gc.get("buyer_firstname", ""),
                    "buyer_lastname": gc.get("buyer_lastname", ""),
                    "recipient_name": gc.get("recipient_name", ""),
                    "expiresAt": gc.get("expiresAt"),
                    "createdAt": gc.get("createdAt")
                }
                for gc in gift_cards
            ]
        }
    
    return {"found": False, "results": [], "error": "Invalid search type"}

@api_router.post("/gift-cards/{gift_card_id}/redeem")
async def redeem_gift_card(gift_card_id: str, authorization: str = Header(None)):
    """Mark a gift card as redeemed/used (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")
    
    # Only active cards can be redeemed
    if gift_card.get("status") != "active":
        raise HTTPException(
            status_code=400,
            detail=f"Only active cards can be redeemed. Current status: {gift_card.get('status')}"
        )
    
    # Mark as redeemed
    await db.gift_cards.update_one(
        {"id": gift_card_id},
        {"$set": {
            "status": "redeemed",
            "redeemedAt": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    return {
        "success": True,
        "message": "Gift card marked as redeemed",
        "gift_card": updated_card
    }

@api_router.get("/gift-cards/list")
async def list_gift_cards(authorization: str = Header(None)):
    """List all gift cards (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    gift_cards = await db.gift_cards.find({}, {"_id": 0}).to_list(2000)
    return sorted(gift_cards, key=lambda x: x.get('createdAt', ''), reverse=True)

@api_router.get("/gift-cards/all")
async def list_gift_cards_all(authorization: str = Header(None)):
    """Alias: List all gift cards (admin only)"""
    return await list_gift_cards(authorization)

@api_router.patch("/gift-cards/{gift_card_id}")
async def update_gift_card(gift_card_id: str, status: str, authorization: str = Header(None)):
    """Update gift card status (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    valid_statuses = ["pending", "active", "failed", "canceled", "expired", "redeemed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.gift_cards.update_one(
        {"id": gift_card_id},
        {"$set": {"status": status}}
    )
    
    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    return gift_card

@api_router.delete("/gift-cards/{gift_card_id}")
async def delete_pending_gift_card(gift_card_id: str, authorization: str = Header(None)):
    """Delete gift card only if status is pending (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")

    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    if gift_card.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending gift cards can be deleted")

    await db.gift_cards.delete_one({"id": gift_card_id})
    return {"success": True}

@api_router.get("/gift-cards/{gift_card_id}")
async def get_gift_card_by_id(gift_card_id: str, authorization: str = Header(None)):
    """Get a single gift card by ID (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")

    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    return gift_card

@api_router.post("/gift-cards/{gift_card_id}/activate")
async def activate_gift_card(gift_card_id: str, authorization: str = Header(None)):
    """Activate a pending gift card and generate a unique code (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")

    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    if gift_card.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending gift cards can be activated")

    # Generate unique code
    code = generate_gift_code()
    
    # Set expiry to 2 years from now
    expiry_date = datetime.now(timezone.utc) + timedelta(days=730)

    await db.gift_cards.update_one(
        {"id": gift_card_id},
        {"$set": {
            "code": code,
            "status": "active",
            "expiresAt": expiry_date.isoformat()
        }}
    )

    updated_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    return updated_card

@api_router.patch("/gift-cards/{gift_card_id}/extend-expiry")
async def extend_gift_card_expiry(
    gift_card_id: str, 
    request: dict,
    authorization: str = Header(None)
):
    """Extend the expiry date of a gift card (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")

    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    new_expiry_date = request.get("new_expiry_date")
    if not new_expiry_date:
        raise HTTPException(status_code=400, detail="new_expiry_date is required")

    # Parse and validate date
    try:
        expiry_dt = datetime.fromisoformat(new_expiry_date.replace('Z', '+00:00'))
        if expiry_dt.tzinfo is None:
            expiry_dt = expiry_dt.replace(tzinfo=timezone.utc)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    await db.gift_cards.update_one(
        {"id": gift_card_id},
        {"$set": {"expiresAt": expiry_dt.isoformat()}}
    )

    return {"success": True, "new_expiry_date": expiry_dt.isoformat()}

@api_router.patch("/gift-cards/{gift_card_id}/update-recipient")
async def update_gift_card_recipient(
    gift_card_id: str,
    request: dict,
    authorization: str = Header(None)
):
    """Update the recipient name of a gift card (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")

    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    recipient_name = request.get("recipient_name")
    if not recipient_name:
        raise HTTPException(status_code=400, detail="recipient_name is required")

    await db.gift_cards.update_one(
        {"id": gift_card_id},
        {"$set": {"recipient_name": recipient_name}}
    )

    return {"success": True, "recipient_name": recipient_name}

@api_router.post("/gift-cards/{gift_card_id}/resend-email")
async def resend_gift_card_email(gift_card_id: str, authorization: str = Header(None)):
    """Resend the gift card email (admin only)"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")

    gift_card = await db.gift_cards.find_one({"id": gift_card_id}, {"_id": 0})
    if not gift_card:
        raise HTTPException(status_code=404, detail="Gift card not found")

    if not gift_card.get("code"):
        raise HTTPException(status_code=400, detail="Gift card must have a code before sending email")

    # Send email
    success = await send_gift_card_email(
        to_email=gift_card["buyer_email"],
        recipient_name=gift_card.get("recipient_name", "") or f"{gift_card['buyer_firstname']} {gift_card['buyer_lastname']}",
        gift_card_code=gift_card["code"],
        amount=gift_card["amountEur"],
        expires_at=gift_card.get("expiresAt", ""),
        buyer_name=f"{gift_card['buyer_firstname']} {gift_card['buyer_lastname']}"
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")

    return {"success": True}

# ============ COUPON ENDPOINTS ============

def verify_admin(authorization: str):
    """Verify admin token"""
    if authorization != os.environ.get('ADMIN_PASSWORD'):
        raise HTTPException(status_code=401, detail="Unauthorized")

@api_router.post("/coupons")
async def create_coupon(coupon: CouponCreate, authorization: str = Header(None)):
    """Create a new coupon"""
    verify_admin(authorization)
    
    # Validate code format
    if not coupon.code or len(coupon.code) < 3:
        raise HTTPException(status_code=400, detail="Coupon code must be at least 3 characters")
    
    # Check if coupon already exists
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    # Validate type
    if coupon.type not in ["percentage", "fixed"]:
        raise HTTPException(status_code=400, detail="Type must be 'percentage' or 'fixed'")
    
    # Validate value
    if coupon.type == "percentage" and (coupon.value < 0 or coupon.value > 100):
        raise HTTPException(status_code=400, detail="Percentage must be between 0 and 100")
    elif coupon.type == "fixed" and coupon.value <= 0:
        raise HTTPException(status_code=400, detail="Fixed amount must be greater than 0")
    
    # Parse validTo date
    try:
        valid_to = datetime.fromisoformat(coupon.validTo.replace('Z', '+00:00'))
    except:
        raise HTTPException(status_code=400, detail="Invalid date format for validTo")
    
    new_coupon = Coupon(
        code=coupon.code.upper(),
        type=coupon.type,
        value=coupon.value,
        validTo=valid_to,
        isActive=coupon.isActive,
        maxUses=coupon.maxUses
    )
    
    doc = new_coupon.model_dump()
    doc['validFrom'] = doc['validFrom'].isoformat()
    doc['validTo'] = doc['validTo'].isoformat()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.coupons.insert_one(doc)
    
    return new_coupon

@api_router.get("/coupons")
async def get_coupons(authorization: str = Header(None)):
    """Get all coupons (admin only)"""
    verify_admin(authorization)
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(2000)
    return sorted(coupons, key=lambda x: x.get('createdAt', ''), reverse=True)

@api_router.get("/coupons/all")
async def get_coupons_all(authorization: str = Header(None)):
    """Alias: Get all coupons (admin only)"""
    return await get_coupons(authorization)

@api_router.put("/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: CouponUpdate, authorization: str = Header(None)):
    """Update a coupon"""
    verify_admin(authorization)
    
    update_data = {}
    
    if coupon.code is not None:
        existing = await db.coupons.find_one({"code": coupon.code.upper(), "id": {"$ne": coupon_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")
        update_data['code'] = coupon.code.upper()
    
    if coupon.type is not None:
        if coupon.type not in ["percentage", "fixed"]:
            raise HTTPException(status_code=400, detail="Type must be 'percentage' or 'fixed'")
        update_data['type'] = coupon.type
    
    if coupon.value is not None:
        update_data['value'] = coupon.value
    
    if coupon.validTo is not None:
        try:
            valid_to = datetime.fromisoformat(coupon.validTo.replace('Z', '+00:00'))
            update_data['validTo'] = valid_to.isoformat()
        except:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    if coupon.isActive is not None:
        update_data['isActive'] = coupon.isActive
    
    if coupon.maxUses is not None:
        update_data['maxUses'] = coupon.maxUses
    
    await db.coupons.update_one({"id": coupon_id}, {"$set": update_data})
    updated = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    return updated

@api_router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, authorization: str = Header(None)):
    """Delete a coupon"""
    verify_admin(authorization)
    
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"success": True}

@api_router.post("/coupons/validate")
async def validate_coupon(code: str):
    """Validate a coupon code and return a validation token (public endpoint)"""
    coupon = await db.coupons.find_one({"code": code.upper()})
    
    if not coupon:
        return {"valid": False, "error": "Coupon not found", "token": None}
    
    if not coupon.get('isActive', False):
        return {"valid": False, "error": "Coupon is inactive", "token": None}
    
    # Check expiration
    valid_to = datetime.fromisoformat(coupon['validTo'])
    if datetime.now(timezone.utc) > valid_to:
        return {"valid": False, "error": "Coupon has expired", "token": None}
    
    # Check max uses
    current_uses = coupon.get('currentUses', 0)
    max_uses = coupon.get('maxUses')
    if max_uses and current_uses >= max_uses:
        return {"valid": False, "error": "Coupon usage limit reached", "token": None}
    
    # Generate unique validation token to prevent duplicate usage
    validation_token = secrets.token_urlsafe(32)
    
    # Create coupon usage record in pending state
    usage = CouponUsage(
        coupon_code=coupon['code'],
        validation_token=validation_token,
        status="pending"
    )
    
    usage_doc = usage.model_dump()
    usage_doc['created_at'] = usage_doc['created_at'].isoformat()
    await db.coupon_usages.insert_one(usage_doc)
    
    return {
        "valid": True,
        "token": validation_token,
        "type": coupon['type'],
        "value": coupon['value'],
        "currency": coupon.get('currency', 'EUR'),
        "currentUses": current_uses,
        "maxUses": max_uses
    }

@api_router.post("/coupons/apply")
async def apply_coupon(token: str, session_id: Optional[str] = None):
    """Apply a coupon using its validation token (marks as used, prevents duplicate)"""
    # Find the usage record with this token
    usage = await db.coupon_usages.find_one({"validation_token": token})
    
    if not usage:
        return {"success": False, "error": "Invalid or expired validation token"}
    
    if usage.get('status') not in ['pending', 'applied-pending']:
        return {"success": False, "error": "Coupon already used or canceled"}
    
    # Update usage status to applied
    now = datetime.now(timezone.utc)
    await db.coupon_usages.update_one(
        {"validation_token": token},
        {"$set": {
            "status": "applied",
            "session_id": session_id,
            "applied_at": now.isoformat()
        }}
    )
    
    # Increment coupon currentUses
    coupon_code = usage['coupon_code']
    await db.coupons.update_one(
        {"code": coupon_code},
        {"$inc": {"currentUses": 1}}
    )
    
    return {
        "success": True,
        "message": "Coupon applied successfully",
        "coupon_code": coupon_code
    }

@api_router.post("/coupons/cancel/{token}")
async def cancel_coupon_usage(token: str):
    """Cancel a pending coupon usage (for when checkout fails)"""
    usage = await db.coupon_usages.find_one({"validation_token": token})
    
    if not usage:
        return {"success": False, "error": "Usage record not found"}
    
    if usage.get('status') != 'pending':
        return {"success": False, "error": "Can only cancel pending coupons"}
    
    # Mark as canceled
    await db.coupon_usages.update_one(
        {"validation_token": token},
        {"$set": {"status": "canceled"}}
    )
    
    return {"success": True, "message": "Coupon usage canceled"}

@api_router.post("/testimonials")
async def create_testimonial(payload: TestimonialCreate):
    """Create a new internal testimonial (public)"""
    testimonial = payload.model_dump()
    testimonial["id"] = str(uuid.uuid4())
    testimonial["createdAt"] = datetime.now(timezone.utc)
    testimonial["isApproved"] = bool(payload.allowDisplay)

    await db.testimonials.insert_one(testimonial)

    return {"success": True, "id": testimonial["id"]}

@api_router.get("/testimonials")
async def list_testimonials(limit: int = 6):
    """List approved internal testimonials"""
    safe_limit = max(1, min(limit, 12))
    cursor = (
        db.testimonials.find({"isApproved": True}, {"_id": 0})
        .sort("createdAt", -1)
        .limit(safe_limit)
    )
    items = await cursor.to_list(safe_limit)
    return {"items": items}

@api_router.get("/google-reviews")
async def get_google_reviews():
    """Fetch Google reviews from Google Places API"""
    place_id = os.environ.get('GOOGLE_PLACE_ID')
    api_key = os.environ.get('GOOGLE_PLACES_API_KEY')
    
    if not place_id or not api_key:
        logger.warning("Google Places API not configured (missing GOOGLE_PLACE_ID or GOOGLE_PLACES_API_KEY)")
        return {
            "name": "Léa Beauté",
            "rating": 4.8,
            "user_ratings_total": 0,
            "reviews": []
        }
    
    try:
        async with httpx.AsyncClient() as client:
            # Get place details including reviews
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/details/json",
                params={
                    "place_id": place_id,
                    "fields": "name,rating,user_ratings_total,reviews",
                    "key": api_key,
                    "language": "fr"
                }
            )
            
            data = response.json()
            
            if data.get('status') != 'OK':
                logger.error(f"Google Places API error: {data.get('status')}")
                return {
                    "name": "Léa Beauté",
                    "rating": 4.8,
                    "user_ratings_total": 0,
                    "reviews": []
                }
            
            
            result = data.get('result', {})
            
            # Format reviews with responses
            reviews = []
            for review in result.get('reviews', [])[:5]:  # Limit to 5 most recent
                reviews.append({
                    "author": review.get('author_name'),
                    "rating": review.get('rating'),
                    "text": review.get('text'),
                    "time": review.get('time'),
                    "relative_time": review.get('relative_time_description'),
                    "profile_photo": review.get('profile_photo_url'),
                    "author_url": review.get('author_url'),
                    # Owner response if exists
                    "reply": {
                        "text": review.get('reply', {}).get('comment'),
                        "time": review.get('reply', {}).get('time')
                    } if review.get('reply') else None
                })
            
            return {
                "name": result.get('name'),
                "rating": result.get('rating'),
                "user_ratings_total": result.get('user_ratings_total'),
                "reviews": reviews
            }
            
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching Google reviews: {e}")
        raise HTTPException(status_code=500, detail="Error fetching reviews")
    except Exception as e:
        logger.error(f"Error fetching Google reviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ BUSINESS HOURS ENDPOINTS ============

# Horaires généraux
@api_router.get("/business-hours")
async def get_all_business_hours():
    """Get all business hours data (general + exceptions + holidays) - UNIFIED ENDPOINT"""
    general = await db.business_hours_general.find_one({"_id": "main"})
    
    if not general:
        general = {
            "0": {"open": None, "close": None},  # Sunday - closed
            "1": {"open": "14:00", "close": "18:30"},  # Monday
            "2": {"open": "09:00", "close": "18:30"},  # Tuesday
            "3": {"open": None, "close": None},  # Wednesday
            "4": {"open": "09:00", "close": "18:30"},  # Thursday
            "5": {"open": "09:00", "close": "18:30"},  # Friday
            "6": {"open": "09:00", "close": "16:00"}  # Saturday
        }
    else:
        general.pop("_id", None)
    
    return general

@api_router.post("/business-hours")
async def update_all_business_hours(data: dict, authorization: str = Header(None)):
    """Update general business hours - receives dict with day as keys"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    doc = {"_id": "main", **data}
    await db.business_hours_general.update_one(
        {"_id": "main"},
        {"$set": doc},
        upsert=True
    )
    return {"success": True}

# Exceptions (dates/périodes spécifiques)
@api_router.get("/business-hours/exceptions")
async def get_exceptions():
    """Get all business hours exceptions"""
    cursor = db.business_hours_exceptions.find({}, {"_id": 0}).sort("date", 1)
    exceptions = await cursor.to_list(length=10000)
    return exceptions

@api_router.post("/business-hours/exceptions")
async def create_exception(data: dict, authorization: str = Header(None)):
    """Create business hours exception (admin only)"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Ensure required fields
    if "date" not in data:
        raise HTTPException(status_code=400, detail="date field required")
    
    doc = {
        "date": data["date"],
        "endDate": data.get("endDate"),
        "isOpen": data.get("isOpen", True),
        "startTime": data.get("startTime"),
        "endTime": data.get("endTime"),
        "reason": data.get("reason", "")
    }
    
    await db.business_hours_exceptions.update_one(
        {"date": data["date"]},
        {"$set": doc},
        upsert=True
    )
    return {"success": True}

@api_router.delete("/business-hours/exceptions/{date}")
async def delete_exception(date: str, authorization: str = Header(None)):
    """Delete business hours exception (admin only)"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    result = await db.business_hours_exceptions.delete_one({"date": date})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    return {"success": True}

# Jours fériés
@api_router.get("/business-hours/holidays")
async def get_holidays():
    """Get all holidays"""
    cursor = db.business_hours_holidays.find({}, {"_id": 0}).sort("date", 1)
    holidays = await cursor.to_list(length=10000)
    return holidays

@api_router.post("/business-hours/holidays")
async def create_or_update_holiday(data: dict, authorization: str = Header(None)):
    """Create or update holiday (admin only)"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    if "date" not in data or "name" not in data:
        raise HTTPException(status_code=400, detail="date and name fields required")
    
    doc = {
        "date": data["date"],
        "name": data["name"],
        "isClosed": data.get("isClosed", True)
    }
    
    await db.business_hours_holidays.update_one(
        {"date": data["date"]},
        {"$set": doc},
        upsert=True
    )
    return {"success": True}

@api_router.delete("/business-hours/holidays/{date}")
async def delete_holiday(date: str, authorization: str = Header(None)):
    """Delete holiday (admin only)"""
    if authorization != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    result = await db.business_hours_holidays.delete_one({"date": date})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Holiday not found")
    
    return {"success": True}

# Statut courant
@api_router.get("/business-hours/status")
async def get_opening_status():
    """Get current opening status (combines all rules)"""
    from datetime import datetime as dt
    
    today = dt.now().date()
    today_str = today.isoformat()
    day_index = today.weekday()
    # Convert Monday=0 to our convention: Sunday=0
    day_key = str((day_index + 1) % 7)
    
    # 1. Vérifier si c'est un jour férié
    holiday = await db.business_hours_holidays.find_one({"date": today_str})
    if holiday:
        if holiday.get("isClosed"):
            return {
                "status": "closed",
                "message": f"Fermé - {holiday.get('name')}",
                "hours": None
            }
    
    # 2. Vérifier s'il y a une exception pour cette date
    exception = await db.business_hours_exceptions.find_one({"date": today_str})
    if exception:
        if not exception.get("isOpen"):
            return {
                "status": "closed",
                "message": f"Fermé - {exception.get('reason', 'Exception')}",
                "hours": None
            }
        else:
            return {
                "status": "open" if is_currently_open({
                    "open": exception.get("startTime"),
                    "close": exception.get("endTime")
                }) else "closed",
                "message": f"Horaires modifiés - {exception.get('reason', 'Exception')}",
                "hours": {
                    "open": exception.get("startTime"),
                    "close": exception.get("endTime")
                }
            }
    
    # 3. Utiliser les horaires généraux du jour
    general_hours = await db.business_hours_general.find_one({"_id": "main"})
    if not general_hours:
        general_hours = {}
    
    day_hours = general_hours.get(day_key, {})
    
    if not day_hours or not day_hours.get("open") or not day_hours.get("close"):
        return {
            "status": "closed",
            "message": "Fermé aujourd'hui",
            "hours": None
        }
    
    return {
        "status": "open" if is_currently_open(day_hours) else "closed",
        "message": "Ouvert" if is_currently_open(day_hours) else "Fermé",
        "hours": day_hours
    }

def is_currently_open(hours: Optional[Dict]) -> bool:
    """Check if currently open based on hours"""
    if not hours:
        return False
    
    from datetime import datetime as dt
    now = dt.now()
    
    open_time = hours.get("open")
    close_time = hours.get("close")
    
    if not open_time or not close_time:
        return False
    
    try:
        open_hour, open_min = map(int, str(open_time).split(":"))
        close_hour, close_min = map(int, str(close_time).split(":"))
        
        current_minutes = now.hour * 60 + now.minute
        open_minutes = open_hour * 60 + open_min
        close_minutes = close_hour * 60 + close_min
        
        return open_minutes <= current_minutes < close_minutes
    except:
        return False

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    await seed_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()