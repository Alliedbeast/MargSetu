$ErrorActionPreference = "Stop"

$BaseUrl = "http://localhost:8000/api"

Write-Host ""
Write-Host "============================================="
Write-Host "        MARG SETU SIH26002 SMOKE TEST"
Write-Host "============================================="
Write-Host ""

# ============================================================
# HELPERS
# ============================================================

function Test-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw "FAILED: $Message"
    }

    Write-Host "PASS: $Message" -ForegroundColor Green
}


function Invoke-ApiGet {
    param(
        [string]$Path,
        [hashtable]$Headers
    )

    return Invoke-RestMethod `
        -Method Get `
        -Uri "$BaseUrl$Path" `
        -Headers $Headers
}


function Invoke-ApiPost {
    param(
        [string]$Path,
        [object]$Body,
        [hashtable]$Headers
    )

    $json = $Body | ConvertTo-Json -Depth 20

    return Invoke-RestMethod `
        -Method Post `
        -Uri "$BaseUrl$Path" `
        -Headers $Headers `
        -ContentType "application/json" `
        -Body $json
}


# ============================================================
# 1. HEALTH
# ============================================================

Write-Host "1) Health"

$health = Invoke-RestMethod `
    -Method Get `
    -Uri "$BaseUrl/health"

Test-Condition `
    ($health.status -eq "ok") `
    "FastAPI health endpoint is operational"

Write-Host "   Version: $($health.version)"
Write-Host ""


# ============================================================
# 2. LOGIN
# ============================================================

Write-Host "2) Authentication"

$loginBody = @{
    username = "admin"
    password = "admin123"
}

$login = Invoke-ApiPost `
    "/auth/login" `
    $loginBody `
    @{}

Test-Condition `
    (-not [string]::IsNullOrWhiteSpace($login.access_token)) `
    "Admin login returns an access token"

Test-Condition `
    ($login.user.username -eq "admin") `
    "Authenticated user is admin"

$token = $login.access_token

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "   Logged in as: $($login.user.displayName)"
Write-Host ""


# ============================================================
# 3. DASHBOARD
# ============================================================

Write-Host "3) Dashboard"

$dashboard = Invoke-ApiGet `
    "/dashboard" `
    $headers

Test-Condition `
    ($null -ne $dashboard.accessibility_percent) `
    "Dashboard accessibility score exists"

Test-Condition `
    ($null -ne $dashboard.active_vehicles) `
    "Dashboard vehicle count exists"

Test-Condition `
    ($null -ne $dashboard.active_shipments) `
    "Dashboard shipment count exists"

Write-Host "   Accessibility: $($dashboard.accessibility_percent)%"
Write-Host "   Vehicles: $($dashboard.active_vehicles)"
Write-Host "   Shipments: $($dashboard.active_shipments)"
Write-Host ""


# ============================================================
# 4. INCIDENTS
# ============================================================

Write-Host "4) Incidents"

$incidents = Invoke-ApiGet `
    "/incidents" `
    $headers

Test-Condition `
    ($null -ne $incidents.items) `
    "Incident list endpoint responds"

Write-Host "   Current incidents: $($incidents.count)"
Write-Host ""


# ============================================================
# 5. RISK CORRIDORS
# ============================================================

Write-Host "5) Corridor Risk"

$riskCorridors = Invoke-ApiGet `
    "/risk/corridors" `
    $headers

Test-Condition `
    ($null -ne $riskCorridors.items) `
    "Risk corridor endpoint responds"

Test-Condition `
    ($riskCorridors.items.Count -gt 0) `
    "At least one corridor is available"

foreach ($corridor in $riskCorridors.items) {
    Write-Host "   $($corridor.id) | $($corridor.route) | $($corridor.risk) | Score $($corridor.score)"
}

Write-Host ""


# ============================================================
# 6. RISK CALCULATION
# ============================================================

Write-Host "6) Risk Engine"

$riskBody = @{
    rainfall = 85
    landslide = 80
    flood = 60
    historical = 70
    field_reports = 55
    traffic = 30
}

$risk = Invoke-ApiPost `
    "/risk/score" `
    $riskBody `
    $headers

Test-Condition `
    ($null -ne $risk.disruption_score) `
    "Risk engine returns disruption score"

Test-Condition `
    ($null -ne $risk.accessibility_score) `
    "Risk engine returns accessibility score"

Test-Condition `
    (-not [string]::IsNullOrWhiteSpace($risk.risk)) `
    "Risk engine returns risk level"

Write-Host "   Risk: $($risk.risk)"
Write-Host "   Disruption score: $($risk.disruption_score)"
Write-Host "   Accessibility score: $($risk.accessibility_score)"
Write-Host ""


# ============================================================
# 7. ALERTS
# ============================================================

Write-Host "7) Alerts"

$alerts = Invoke-ApiGet `
    "/alerts" `
    $headers

Test-Condition `
    ($null -ne $alerts.items) `
    "Alert endpoint responds"

Write-Host "   Alerts: $($alerts.count)"
Write-Host ""


# ============================================================
# 8. VEHICLES
# ============================================================

Write-Host "8) Vehicles"

$vehicles = Invoke-ApiGet `
    "/vehicles" `
    $headers

Test-Condition `
    ($null -ne $vehicles.items) `
    "Vehicle endpoint responds"

Test-Condition `
    ($vehicles.items.Count -gt 0) `
    "Vehicle fleet contains vehicles"

foreach ($vehicle in $vehicles.items) {
    Write-Host "   $($vehicle.id) | $($vehicle.status) | $($vehicle.origin) -> $($vehicle.destination)"
}

Write-Host ""


# ============================================================
# 9. SHIPMENTS
# ============================================================

Write-Host "9) Shipments"

$shipments = Invoke-ApiGet `
    "/shipments" `
    $headers

Test-Condition `
    ($null -ne $shipments.items) `
    "Shipment endpoint responds"

Test-Condition `
    ($shipments.items.Count -gt 0) `
    "Shipment list contains shipments"

$targetShipment =
    $shipments.items |
    Where-Object {
        $_.priority -eq "Critical"
    } |
    Select-Object -First 1

if (-not $targetShipment) {
    $targetShipment =
        $shipments.items |
        Select-Object -First 1
}

Test-Condition `
    ($null -ne $targetShipment) `
    "A shipment is available for route testing"

Write-Host "   Selected shipment: $($targetShipment.id)"
Write-Host "   Cargo: $($targetShipment.cargo)"
Write-Host "   Priority: $($targetShipment.priority)"
Write-Host "   Risk: $($targetShipment.risk)"
Write-Host ""


# ============================================================
# 10. ROUTE RECOMMENDATION
# ============================================================

Write-Host "10) Smart Route Recommendation"

$routeRequest = @{
    shipment_id = $targetShipment.id
    origin = $targetShipment.origin
    destination = $targetShipment.destination
    cargo_priority = $targetShipment.priority
}

$recommendation = Invoke-ApiPost `
    "/routes/recommend" `
    $routeRequest `
    $headers

Test-Condition `
    ($null -ne $recommendation.recommended) `
    "Route recommendation returns a recommended option"

Test-Condition `
    ($recommendation.options.Count -ge 3) `
    "At least three route alternatives are returned"

Test-Condition `
    (-not [string]::IsNullOrWhiteSpace($recommendation.recommended.name)) `
    "Recommended route contains a route name"

Write-Host "   Recommended: $($recommendation.recommended.name)"
Write-Host "   Risk: $($recommendation.recommended.risk)"
Write-Host "   Risk score: $($recommendation.recommended.risk_score)"
Write-Host "   ETA: $($recommendation.recommended.eta)"
Write-Host ""


# ============================================================
# 11. ROUTE GEOMETRY
# ============================================================

Write-Host "11) Route Geometry"

$recommendedGeometry =
    $recommendation.recommended.geometry

Test-Condition `
    ($null -ne $recommendedGeometry) `
    "Recommended route includes geometry"

Test-Condition `
    ($recommendedGeometry.Count -ge 2) `
    "Recommended route geometry contains multiple coordinates"

Write-Host "   Coordinates: $($recommendedGeometry.Count)"
Write-Host ""


# ============================================================
# 12. APPROVE ROUTE
# ============================================================

Write-Host "12) Route Approval"

$approveRequest = @{
    shipment_id = $targetShipment.id
    route_id = $recommendation.recommended.id
    route_name = $recommendation.recommended.name
    origin = $targetShipment.origin
    destination = $targetShipment.destination
    old_eta = $targetShipment.current_eta
    new_eta = $recommendation.recommended.eta
    distance_km = $recommendation.recommended.distance_km
    risk = $recommendation.recommended.risk
    risk_score = $recommendation.recommended.risk_score
}

$approved = Invoke-ApiPost `
    "/routes/approve" `
    $approveRequest `
    $headers

Test-Condition `
    ($approved.shipment_id -eq $targetShipment.id) `
    "Approved route is linked to selected shipment"

Test-Condition `
    (-not [string]::IsNullOrWhiteSpace($approved.route_name)) `
    "Approval contains route name"

Test-Condition `
    ($null -ne $approved.geometry) `
    "Approved route stores geometry"

Test-Condition `
    ($approved.geometry.Count -ge 2) `
    "Approved route contains geometry coordinates"

Write-Host "   Approved: $($approved.route_name)"
Write-Host "   Shipment: $($approved.shipment_id)"
Write-Host "   Approved by: $($approved.approved_by)"
Write-Host ""


# ============================================================
# 13. APPROVED ROUTES
# ============================================================

Write-Host "13) Approved Route History"

$approvedRoutes = Invoke-ApiGet `
    "/routes/approved" `
    $headers

Test-Condition `
    ($null -ne $approvedRoutes.items) `
    "Approved route endpoint responds"

Test-Condition `
    ($approvedRoutes.items.Count -gt 0) `
    "Approved route history contains at least one route"

Write-Host "   Approved routes: $($approvedRoutes.count)"
Write-Host ""


# ============================================================
# 14. VERIFY SHIPMENT WAS REROUTED
# ============================================================

Write-Host "14) Shipment Propagation"

$shipmentsAfterApproval = Invoke-ApiGet `
    "/shipments" `
    $headers

$updatedShipment =
    $shipmentsAfterApproval.items |
    Where-Object {
        $_.id -eq $targetShipment.id
    } |
    Select-Object -First 1

Test-Condition `
    ($null -ne $updatedShipment) `
    "Approved shipment still exists"

Test-Condition `
    (
        $updatedShipment.status -eq "Rerouted" -or
        $updatedShipment.operational_status -eq "Rerouted"
    ) `
    "Shipment status reflects approved reroute"

Test-Condition `
    ($updatedShipment.current_route -eq $approved.route_name) `
    "Shipment current route matches approved route"

Test-Condition `
    ($updatedShipment.current_eta -eq $approved.new_eta) `
    "Shipment ETA matches approved route"

Write-Host "   Status: $($updatedShipment.status)"
Write-Host "   Operational status: $($updatedShipment.operational_status)"
Write-Host "   Current route: $($updatedShipment.current_route)"
Write-Host "   Current ETA: $($updatedShipment.current_eta)"
Write-Host ""


# ============================================================
# 15. FINAL RESULT
# ============================================================

Write-Host ""
Write-Host "============================================="
Write-Host "          SMOKE TEST PASSED"
Write-Host "============================================="
Write-Host ""

Write-Host "Authentication       : PASS" -ForegroundColor Green
Write-Host "Dashboard            : PASS" -ForegroundColor Green
Write-Host "Incidents            : PASS" -ForegroundColor Green
Write-Host "Risk Engine          : PASS" -ForegroundColor Green
Write-Host "Alerts               : PASS" -ForegroundColor Green
Write-Host "Vehicles             : PASS" -ForegroundColor Green
Write-Host "Shipments            : PASS" -ForegroundColor Green
Write-Host "Route Recommendation : PASS" -ForegroundColor Green
Write-Host "Route Geometry       : PASS" -ForegroundColor Green
Write-Host "Route Approval       : PASS" -ForegroundColor Green
Write-Host "Shipment Propagation : PASS" -ForegroundColor Green
Write-Host ""
Write-Host "Marg Setu backend integration is operational."
Write-Host ""