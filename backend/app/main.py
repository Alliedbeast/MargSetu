from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Marg Setu API",
    version="2.1.0",
    description=(
        "AI-assisted disaster-aware logistics intelligence "
        "API for SIH26002 / Marg Setu."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTH / USERS
# ============================================================

USERS = {
    "admin": {
        "password": "admin123",
        "displayName": "Off By One",
        "role": "Admin",
    },
    "field": {
        "password": "field123",
        "displayName": "Tawang Field Officer",
        "role": "Field Officer",
    },
    "district": {
        "password": "district123",
        "displayName": "Kamrup District Desk",
        "role": "District Officer",
    },
}


# ============================================================
# DEMO TOKENS
#
# Deterministic demo tokens survive Uvicorn reloads.
#
# These are for the SIH prototype only.
# ============================================================

TOKENS: dict[str, str] = {
    "marg-setu-demo-admin-token": "admin",
    "marg-setu-demo-field-token": "field",
    "marg-setu-demo-district-token": "district",
}


# ============================================================
# IN-MEMORY STORES
# ============================================================

INCIDENTS: list[dict] = []
APPROVED_REROUTES: list[dict] = []


# ============================================================
# DEMO VEHICLES
# ============================================================

VEHICLES = [
    {
        "id": "VH-104",
        "status": "Warning",
        "driver": "Driver 104",
        "origin": "Guwahati",
        "destination": "Tawang",
        "route": "Guwahati → Tawang",
        "eta": "08:40",
        "lat": 26.1445,
        "lng": 91.7362,
    },
    {
        "id": "VH-112",
        "status": "Moving",
        "driver": "Driver 112",
        "origin": "Shillong",
        "destination": "Silchar",
        "route": "Shillong → Silchar",
        "eta": "09:20",
        "lat": 25.5788,
        "lng": 91.8933,
    },
    {
        "id": "VH-131",
        "status": "Delayed",
        "driver": "Driver 131",
        "origin": "Aizawl",
        "destination": "Lunglei",
        "route": "Aizawl → Lunglei",
        "eta": "10:15",
        "lat": 23.7271,
        "lng": 92.7176,
    },
    {
        "id": "VH-144",
        "status": "Moving",
        "driver": "Driver 144",
        "origin": "Dimapur",
        "destination": "Kohima",
        "route": "Dimapur → Kohima",
        "eta": "07:55",
        "lat": 25.9110,
        "lng": 93.7217,
    },
]


# ============================================================
# DEMO SHIPMENTS
# ============================================================

SHIPMENTS = [
    {
        "id": "SHP-A102",
        "cargo": "Critical Medicine",
        "priority": "Critical",
        "origin": "Guwahati",
        "destination": "Tawang",
        "vehicleId": "VH-104",
        "eta": "08:40",
        "risk": "High",
        "status": "In Transit",
    },
    {
        "id": "SHP-B208",
        "cargo": "Food Supplies",
        "priority": "High",
        "origin": "Shillong",
        "destination": "Silchar",
        "vehicleId": "VH-112",
        "eta": "09:20",
        "risk": "Moderate",
        "status": "In Transit",
    },
    {
        "id": "SHP-C317",
        "cargo": "Construction Material",
        "priority": "Medium",
        "origin": "Dimapur",
        "destination": "Kohima",
        "vehicleId": "VH-144",
        "eta": "07:55",
        "risk": "Low",
        "status": "In Transit",
    },
    {
        "id": "SHP-D411",
        "cargo": "Agricultural Produce",
        "priority": "Medium",
        "origin": "Aizawl",
        "destination": "Lunglei",
        "vehicleId": "VH-131",
        "eta": "10:15",
        "risk": "High",
        "status": "At Risk",
    },
]


# ============================================================
# CORRIDORS
# ============================================================

CORRIDORS = [
    {
        "id": "R-104",
        "name": "R-104",
        "route": "Guwahati → Tawang",
        "base_risk": 82,
        "rainfall": 72,
        "landslide": 82,
        "flood": 21,
        "historical": 74,
        "traffic": 18,
        "vehicles": 6,
        "shipments": 3,
    },
    {
        "id": "R-54",
        "name": "R-54",
        "route": "Aizawl → Lunglei",
        "base_risk": 68,
        "rainfall": 64,
        "landslide": 77,
        "flood": 36,
        "historical": 69,
        "traffic": 23,
        "vehicles": 8,
        "shipments": 5,
    },
    {
        "id": "R-211",
        "name": "R-211",
        "route": "Shillong → Silchar",
        "base_risk": 42,
        "rainfall": 51,
        "landslide": 38,
        "flood": 47,
        "historical": 44,
        "traffic": 31,
        "vehicles": 5,
        "shipments": 7,
    },
    {
        "id": "R-318",
        "name": "R-318",
        "route": "Dimapur → Kohima",
        "base_risk": 16,
        "rainfall": 28,
        "landslide": 22,
        "flood": 14,
        "historical": 21,
        "traffic": 18,
        "vehicles": 11,
        "shipments": 12,
    },
]


# ============================================================
# DEMO ROUTE GEOMETRIES
#
# Coordinates are deterministic demonstration geometry.
# They are NOT turn-by-turn navigation geometry.
#
# Format = [latitude, longitude]
# ============================================================

ROUTE_GEOMETRIES = {
    "A": [
        [26.1445, 91.7362],
        [26.4040, 92.0470],
        [26.7000, 92.3500],
        [27.0500, 92.4800],
        [27.2170, 92.3200],
    ],
    "B": [
        [26.1445, 91.7362],
        [26.2500, 92.0500],
        [26.4000, 92.5000],
        [26.7200, 92.7200],
        [27.2170, 92.3200],
    ],
    "C": [
        [26.1445, 91.7362],
        [26.3200, 91.9500],
        [26.5700, 92.1800],
        [26.8500, 92.2500],
        [27.2170, 92.3200],
    ],
}


# ============================================================
# PYDANTIC MODELS
# ============================================================

class LoginBody(BaseModel):
    username: str
    password: str


class RiskInput(BaseModel):
    rainfall: float = Field(ge=0, le=100)
    landslide: float = Field(ge=0, le=100)
    flood: float = Field(ge=0, le=100)
    historical: float = Field(ge=0, le=100)
    field_reports: float = Field(ge=0, le=100)
    traffic: float = Field(ge=0, le=100)


class IncidentBody(BaseModel):
    incident_type: str

    severity: Literal[
        "Low",
        "Moderate",
        "High",
        "Critical",
    ]

    description: str = ""

    location: str = "Unknown location"

    lat: float | None = None

    lng: float | None = None

    accuracy: float | None = None

    reported_by: str = "Unknown officer"

    device_id: str = "UNKNOWN"

    photo_name: str | None = None

    ai_classification: str | None = None

    ai_confidence: float | None = None

    sync_status: str = "synced"


class RouteRecommendBody(BaseModel):
    shipment_id: str | None = None

    origin: str = "Guwahati"

    destination: str = "Tawang"

    cargo_priority: Literal[
        "Critical",
        "High",
        "Medium",
        "Low",
    ] = "Critical"


class RouteApproveBody(BaseModel):
    shipment_id: str

    route_id: str

    route_name: str

    origin: str

    destination: str

    old_eta: str

    new_eta: str

    distance_km: float

    risk: str

    risk_score: int


# ============================================================
# AUTH HELPERS
# ============================================================

def get_current_username(
    authorization: str | None = Header(default=None),
) -> str:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    if not authorization.lower().startswith(
        "bearer "
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization.split(
        " ",
        1,
    )[1].strip()

    username = TOKENS.get(
        token
    )

    if not username:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    return username


# ============================================================
# GENERAL HELPERS
# ============================================================

def now_iso() -> str:
    return datetime.now(
        timezone.utc
    ).isoformat()


def risk_level(
    score: int,
) -> str:
    if score >= 76:
        return "Critical"

    if score >= 56:
        return "High"

    if score >= 31:
        return "Moderate"

    return "Low"


def corridor_matches_shipment(
    shipment: dict,
    corridor: dict,
) -> bool:
    route_text = (
        f"{shipment['origin']} "
        f"{shipment['destination']}"
    ).lower()

    if corridor["id"] == "R-104":
        return (
            "guwahati" in route_text
            and (
                "tawang" in route_text
                or "bomdila" in route_text
            )
        )

    if corridor["id"] == "R-54":
        return (
            "aizawl" in route_text
            or "lunglei" in route_text
        )

    if corridor["id"] == "R-211":
        return (
            "shillong" in route_text
            or "silchar" in route_text
        )

    if corridor["id"] == "R-318":
        return (
            "dimapur" in route_text
            or "kohima" in route_text
        )

    return False


# ============================================================
# RISK ENGINE
# ============================================================

def calculate_corridor(
    corridor: dict,
) -> dict:
    field_incidents = 0
    critical_incidents = 0
    risk_increase = 0.0

    for incident in INCIDENTS:
        incident_type = incident[
            "incident_type"
        ]

        severity = incident[
            "severity"
        ]

        severity_weight = {
            "Low": 4,
            "Moderate": 7,
            "High": 12,
            "Critical": 18,
        }.get(
            severity,
            4,
        )

        type_weight = {
            "Landslide / Debris": 1.35,
            "Road Damage": 1.15,
            "Bridge Issue": 1.20,
            "Flooding": 1.10,
            "Heavy Rainfall": 0.90,
            "Traffic Blockage": 0.70,
            "Other": 0.55,
        }.get(
            incident_type,
            0.55,
        )

        corridor_weight = 0.35

        if corridor["id"] == "R-104":
            if incident_type in {
                "Landslide / Debris",
                "Road Damage",
                "Bridge Issue",
            }:
                corridor_weight = 1.25

        elif corridor["id"] == "R-54":
            if incident_type in {
                "Landslide / Debris",
                "Heavy Rainfall",
                "Bridge Issue",
            }:
                corridor_weight = 1.15

        elif corridor["id"] == "R-211":
            if incident_type in {
                "Flooding",
                "Heavy Rainfall",
                "Traffic Blockage",
            }:
                corridor_weight = 1.20

        elif corridor["id"] == "R-318":
            if incident_type == "Bridge Issue":
                corridor_weight = 1.10

        risk_increase += (
            severity_weight
            * type_weight
            * corridor_weight
        )

        if corridor_weight > 0.5:
            field_incidents += 1

        if (
            corridor_weight > 0.5
            and severity
            in {
                "Critical",
                "High",
            }
        ):
            critical_incidents += 1

    risk_score = min(
        98,
        round(
            corridor["base_risk"]
            + risk_increase
        ),
    )

    accessibility_score = max(
        2,
        100 - risk_score,
    )

    disruption_probability = min(
        99,
        round(
            risk_score * 0.92
        ),
    )

    field_report_score = min(
        100,
        round(
            corridor["base_risk"]
            * 0.55
            + field_incidents * 14
        ),
    )

    return {
        **corridor,

        "risk": risk_level(
            risk_score
        ),

        "score": accessibility_score,

        "probability": disruption_probability,

        "field_reports": field_report_score,

        "incident_count": field_incidents,

        "critical_incident_count": critical_incidents,

        "affected_vehicles": (
            corridor["vehicles"]
            + critical_incidents * 2
        ),

        "affected_shipments": (
            corridor["shipments"]
            + critical_incidents
        ),

        "action": (
            "Reroute critical shipments"
            if risk_score >= 76
            else "Monitor and prepare reroute"
            if risk_score >= 56
            else "Continue enhanced monitoring"
            if risk_score >= 31
            else "Route remains accessible"
        ),
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root() -> dict:
    return {
        "name": "Marg Setu",
        "project": "SIH26002",
        "status": "operational",
        "docs": "/docs",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "marg-setu-api",
        "version": "2.1.0",
        "time": now_iso(),
    }


# ============================================================
# AUTH
# ============================================================

@app.post("/api/auth/login")
def login(
    body: LoginBody,
) -> dict:
    user = USERS.get(
        body.username
    )

    if (
        not user
        or user["password"]
        != body.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    token_by_user = {
        "admin":
            "marg-setu-demo-admin-token",

        "field":
            "marg-setu-demo-field-token",

        "district":
            "marg-setu-demo-district-token",
    }

    token = token_by_user[
        body.username
    ]

    return {
        "access_token": token,

        "user": {
            "username": body.username,
            "displayName": user[
                "displayName"
            ],
            "role": user[
                "role"
            ],
        },
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    corridors = [
        calculate_corridor(
            corridor
        )
        for corridor in CORRIDORS
    ]

    critical = sum(
        1
        for corridor in corridors
        if corridor["risk"]
        == "Critical"
    )

    high = sum(
        1
        for corridor in corridors
        if corridor["risk"]
        in {
            "Critical",
            "High",
        }
    )

    accessible = sum(
        1
        for corridor in corridors
        if corridor["risk"]
        == "Low"
    )

    accessibility_percent = round(
        (
            accessible
            / max(
                1,
                len(corridors),
            )
        )
        * 100
    )

    affected_vehicles = sum(
        corridor[
            "affected_vehicles"
        ]
        for corridor in corridors
        if corridor["risk"]
        in {
            "High",
            "Critical",
        }
    )

    affected_shipments = sum(
        corridor[
            "affected_shipments"
        ]
        for corridor in corridors
        if corridor["risk"]
        in {
            "High",
            "Critical",
        }
    )

    critical_incident_count = sum(
        1
        for incident in INCIDENTS
        if incident["severity"]
        == "Critical"
    )

    return {
        "accessibility_percent":
            accessibility_percent,

        "high_risk_corridors":
            high,

        "critical_corridors":
            critical,

        "active_vehicles":
            126,

        "active_shipments":
            len(SHIPMENTS),

        "critical_alerts": (
            critical
            + critical_incident_count
        ),

        "field_incidents":
            len(INCIDENTS),

        "affected_vehicles":
            affected_vehicles,

        "affected_shipments":
            affected_shipments,
    }


# ============================================================
# RISK
# ============================================================

@app.post("/api/risk/score")
def risk_score(
    body: RiskInput,
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    score = round(
        body.rainfall * 0.20
        + body.landslide * 0.25
        + body.flood * 0.15
        + body.historical * 0.18
        + body.field_reports * 0.14
        + body.traffic * 0.08
    )

    return {
        "accessibility_score":
            max(
                0,
                100 - score
            ),

        "disruption_score":
            score,

        "risk":
            risk_level(
                score
            ),

        "factors": {
            "rainfall":
                body.rainfall,

            "landslide":
                body.landslide,

            "flood":
                body.flood,

            "historical":
                body.historical,

            "field_reports":
                body.field_reports,

            "traffic":
                body.traffic,
        },

        "explanation": (
            "Weighted prototype disruption-risk "
            "decision model. Replace with a validated "
            "trained model when sufficient labeled "
            "data becomes available."
        ),
    }


@app.get("/api/risk/corridors")
def risk_corridors(
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    corridors = [
        calculate_corridor(
            corridor
        )
        for corridor in CORRIDORS
    ]

    return {
        "items": corridors,
        "generated_at":
            now_iso(),
    }


# ============================================================
# INCIDENTS
# ============================================================

@app.post("/api/incidents")
def create_incident(
    body: IncidentBody,
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    incident = {
        "id":
            f"INC-{len(INCIDENTS) + 1:04d}",

        **body.model_dump(),

        "created_at":
            now_iso(),

        "status":
            "Open",

        "sync_status":
            "synced",
    }

    INCIDENTS.append(
        incident
    )

    return incident


@app.get("/api/incidents")
def list_incidents(
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    return {
        "items":
            INCIDENTS,

        "count":
            len(INCIDENTS),
    }


# ============================================================
# ALERTS
# ============================================================

@app.get("/api/alerts")
def list_alerts(
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    alerts: list[dict] = []

    for incident in reversed(
        INCIDENTS
    ):
        alerts.append(
            {
                "id":
                    f"LIVE-{incident['id']}",

                "title": (
                    "LIVE: "
                    f"{incident['incident_type']}"
                ),

                "detail": (
                    f"{incident['severity']} "
                    "field report received "
                    f"at {incident['location']}."
                ),

                "severity":
                    incident["severity"],

                "time":
                    incident["created_at"],

                "action": (
                    "routes"
                    if incident["severity"]
                    in {
                        "High",
                        "Critical",
                    }
                    else "alerts"
                ),

                "source":
                    "Field Officer",

                "isLive":
                    True,
            }
        )

    for corridor in CORRIDORS:
        calculated = calculate_corridor(
            corridor
        )

        if calculated["risk"] in {
            "High",
            "Critical",
        }:
            alerts.append(
                {
                    "id":
                        f"RISK-{corridor['id']}",

                    "title": (
                        f"LIVE: {corridor['id']} "
                        f"{calculated['risk']} risk"
                    ),

                    "detail": (
                        f"{corridor['route']} "
                        "has accessibility "
                        f"{calculated['score']}/100 "
                        "and disruption probability "
                        f"{calculated['probability']}%."
                    ),

                    "severity":
                        calculated["risk"],

                    "time":
                        "Live risk engine",

                    "action":
                        "routes",

                    "source":
                        "Risk Engine",

                    "isLive":
                        True,
                }
            )

    return {
        "items":
            alerts,

        "count":
            len(alerts),
    }


# ============================================================
# SHIPMENTS
# ============================================================

@app.get("/api/shipments")
def list_shipments(
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    corridors = [
        calculate_corridor(
            corridor
        )
        for corridor in CORRIDORS
    ]

    result = []

    for shipment in SHIPMENTS:
        matching = [
            corridor
            for corridor in corridors
            if corridor_matches_shipment(
                shipment,
                corridor,
            )
        ]

        dangerous = sorted(
            [
                corridor
                for corridor in matching
                if corridor["risk"]
                in {
                    "High",
                    "Critical",
                }
            ],
            key=lambda item:
                item["probability"],
            reverse=True,
        )

        item = dict(
            shipment
        )

        if dangerous:
            corridor = dangerous[0]

            item["affected"] = True

            item["risk"] = (
                "Critical"
                if (
                    corridor["risk"]
                    == "Critical"
                    or shipment["priority"]
                    == "Critical"
                )
                else "High"
            )

            item["risk_score"] = min(
                99,
                round(
                    corridor[
                        "probability"
                    ]
                    * (
                        1.5
                        if shipment[
                            "priority"
                        ]
                        == "Critical"
                        else 1.2
                    )
                ),
            )

            item[
                "operational_status"
            ] = (
                "Reroute Recommended"
            )

            item[
                "impact_reason"
            ] = (
                f"{corridor['id']} is "
                f"{corridor['risk'].lower()} risk "
                "with "
                f"{corridor['probability']}% "
                "disruption probability."
            )

        else:
            item["affected"] = False

            item["risk_score"] = 15

            item[
                "operational_status"
            ] = "In Transit"

            item[
                "impact_reason"
            ] = (
                "No active high-risk "
                "corridor detected."
            )

        approved = next(
            (
                route
                for route
                in APPROVED_REROUTES
                if route[
                    "shipment_id"
                ]
                == shipment["id"]
            ),
            None,
        )

        if approved:
            item["status"] = (
                "Rerouted"
            )

            item[
                "operational_status"
            ] = "Rerouted"

            item[
                "current_route"
            ] = approved[
                "route_name"
            ]

            item[
                "current_eta"
            ] = approved[
                "new_eta"
            ]

            item[
                "risk_score"
            ] = approved[
                "risk_score"
            ]

            item["risk"] = approved[
                "risk"
            ]

            item["affected"] = True

            item[
                "route_geometry"
            ] = approved[
                "geometry"
            ]

        else:
            item[
                "current_route"
            ] = (
                f"{shipment['origin']} → "
                f"{shipment['destination']}"
            )

            item[
                "current_eta"
            ] = shipment[
                "eta"
            ]

            item[
                "route_geometry"
            ] = None

        result.append(
            item
        )

    return {
        "items":
            result,

        "count":
            len(result),
    }


# ============================================================
# VEHICLES
# ============================================================

@app.get("/api/vehicles")
def list_vehicles(
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    return {
        "items":
            VEHICLES,

        "count":
            len(VEHICLES),
    }


# ============================================================
# SMART ROUTING
# ============================================================

@app.post("/api/routes/recommend")
def recommend_route(
    body: RouteRecommendBody,
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    penalty = {
        "Critical": 1.5,
        "High": 1.25,
        "Medium": 1.0,
        "Low": 0.8,
    }[
        body.cargo_priority
    ]

    options = [
        {
            "id": "A",

            "name":
                "Route A · Direct Corridor",

            "distance_km":
                210,

            "eta":
                "5h 10m",

            "risk":
                "High",

            "risk_score":
                round(
                    82
                    * penalty
                    / 1.5
                ),

            "reason":
                "Shortest corridor but "
                "exposed to active landslide risk.",

            "checkpoints": [
                "Guwahati",
                "Bomdila",
                "Sela approach",
                "Tawang",
            ],

            "geometry":
                ROUTE_GEOMETRIES["A"],
        },

        {
            "id": "B",

            "name":
                "Route B · Safer Corridor",

            "distance_km":
                235,

            "eta":
                "5h 45m",

            "risk":
                "Low",

            "risk_score":
                round(
                    26
                    * penalty
                    / 1.5
                ),

            "reason":
                "Longer route with materially "
                "lower disruption exposure.",

            "checkpoints": [
                "Guwahati",
                "Tezpur",
                "Dirang",
                "Tawang",
            ],

            "geometry":
                ROUTE_GEOMETRIES["B"],
        },

        {
            "id": "C",

            "name":
                "Route C · Contingency Corridor",

            "distance_km":
                220,

            "eta":
                "6h 20m",

            "risk":
                "Moderate",

            "risk_score":
                round(
                    51
                    * penalty
                    / 1.5
                ),

            "reason":
                "Balanced contingency route "
                "with additional travel time.",

            "checkpoints": [
                "Guwahati",
                "Nagaon",
                "Bhalukpong",
                "Tawang",
            ],

            "geometry":
                ROUTE_GEOMETRIES["C"],
        },
    ]

    options.sort(
        key=lambda item: (
            item["risk_score"]
            + (
                item[
                    "distance_km"
                ]
                / 100
                * 5
            )
        )
    )

    return {
        "cargo_priority":
            body.cargo_priority,

        "origin":
            body.origin,

        "destination":
            body.destination,

        "shipment_id":
            body.shipment_id,

        "recommended":
            options[0],

        "options":
            options,

        "method":
            "risk-adjusted feasibility ranking",
    }


@app.post("/api/routes/approve")
def approve_route(
    body: RouteApproveBody,
    username: str = Depends(
        get_current_username
    ),
) -> dict:
    geometry = ROUTE_GEOMETRIES.get(
        body.route_id,
        [],
    )

    reroute = {
        "shipment_id":
            body.shipment_id,

        "route_id":
            body.route_id,

        "route_name":
            body.route_name,

        "origin":
            body.origin,

        "destination":
            body.destination,

        "old_eta":
            body.old_eta,

        "new_eta":
            body.new_eta,

        "distance_km":
            body.distance_km,

        "risk":
            body.risk,

        "risk_score":
            body.risk_score,

        "geometry":
            geometry,

        "approved_by":
            username,

        "approved_at":
            now_iso(),
    }

    APPROVED_REROUTES[:] = [
        item
        for item
        in APPROVED_REROUTES
        if item[
            "shipment_id"
        ]
        != body.shipment_id
    ]

    APPROVED_REROUTES.append(
        reroute
    )

    return reroute


@app.get("/api/routes/approved")
def list_approved_routes(
    _: str = Depends(
        get_current_username
    ),
) -> dict:
    return {
        "items":
            APPROVED_REROUTES,

        "count":
            len(
                APPROVED_REROUTES
            ),
    }