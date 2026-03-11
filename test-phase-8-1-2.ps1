# Phase 8.1.2 Quick Test with PowerShell
# 
# This script tests the POST /api/verification/documents/:documentId/verify-all endpoint
#
# Requirements:
#   - PowerShell (Windows built-in)
#   - Backend running on http://localhost:5000
#   - Valid JWT token from user login
#   - Document ID from a document you own
#
# Usage:
#   .\test-phase-8-1-2.ps1 -JwtToken "eyJhbGc..." -DocumentId "507f1f..."
#
# Or in PowerShell:
#   $token = "your_jwt_token"
#   $docId = "your_document_id"
#   .\test-phase-8-1-2.ps1 -JwtToken $token -DocumentId $docId

param(
    [Parameter(Mandatory=$true)]
    [string]$JwtToken,
    
    [Parameter(Mandatory=$false)]
    [string]$DocumentId = "invalid_id_test",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:5000"
)

# Color output helper
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Test execution
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
Write-ColorOutput "Phase 8.1.2 Verification Endpoint Test" -Color Cyan
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
Write-Host ""

Write-ColorOutput "Base URL:     $BaseUrl" -Color Blue
Write-ColorOutput "JWT Token:    $($JwtToken.Substring(0, [Math]::Min(20, $JwtToken.Length)))..." -Color Blue
Write-ColorOutput "Document ID:  $DocumentId" -Color Blue
Write-Host ""

if ($DocumentId -eq "invalid_id_test") {
    Write-ColorOutput "⚠ Document ID not provided, using invalid ID for testing" -Color Yellow
}

Write-ColorOutput "Sending POST request..." -Color Yellow
Write-Host ""

try {
    # Prepare request
    $Uri = "$BaseUrl/api/verification/documents/$DocumentId/verify-all"
    $Headers = @{
        "Authorization" = "Bearer $JwtToken"
        "Content-Type" = "application/json"
    }
    
    # Send request
    $StartTime = Get-Date
    $Response = Invoke-WebRequest -Uri $Uri -Method Post -Headers $Headers -UseBasicParsing
    $Duration = ((Get-Date) - $StartTime).TotalMilliseconds
    
    $StatusCode = $Response.StatusCode
    $Body = $Response.Content | ConvertFrom-Json
    
} catch {
    # Handle errors
    $Response = $_.Exception.Response
    $StatusCode = $Response.StatusCode.value__
    
    try {
        $Stream = $Response.GetResponseStream()
        $Reader = New-Object System.IO.StreamReader($Stream)
        $Body = $Reader.ReadToEnd() | ConvertFrom-Json
        $Reader.Close()
    } catch {
        $Body = @{ error = $_.Exception.Message }
    }
}

# Display results
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
Write-ColorOutput "Response Received" -Color Cyan
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
Write-Host ""

Write-ColorOutput "Status Code: $StatusCode" -Color $(if ($StatusCode -eq 200) { "Green" } else { "Yellow" })
if ($Duration) {
    Write-ColorOutput "Duration: ${Duration}ms" -Color Blue
}
Write-Host ""

Write-ColorOutput "Response Body:" -Color Cyan
Write-Host ""
$Body | ConvertTo-Json -Depth 10
Write-Host ""

# Validate response
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
Write-ColorOutput "Response Validation" -Color Cyan
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
Write-Host ""

if ($StatusCode -eq 200) {
    Write-ColorOutput "✓ Status 200 OK - Verification successful" -Color Green
    Write-Host ""
    Write-ColorOutput "Checking response structure..." -Color Blue
    
    if ($Body.success) {
        Write-ColorOutput "  ✓ Has 'success' field set to true" -Color Green
    }
    
    if ($Body.data.verification) {
        Write-ColorOutput "  ✓ Has verification data" -Color Green
        
        $Title = $Body.data.verification.document_title ?? "N/A"
        $Sigs = $Body.data.verification.signature_count ?? "N/A"
        $Valid = $Body.data.verification.verified_count ?? "N/A"
        
        Write-Host "    - Document: $Title"
        Write-Host "    - Total Signatures: $Sigs"
        Write-Host "    - Valid Signatures: $Valid"
    }
    
    if ($Body.data.tampering) {
        Write-ColorOutput "  ✓ Has tampering data" -Color Green
        Write-Host "    - Tampering detected: $($Body.data.tampering.tampered)"
    }
    
    if ($Body.data.summary.requestId) {
        Write-ColorOutput "  ✓ Has request ID: $($Body.data.summary.requestId)" -Color Green
    }
    
    if ($Body.data.summary.verificationDuration) {
        Write-ColorOutput "  ✓ Verification duration: $($Body.data.summary.verificationDuration)" -Color Green
    }
    
} elseif ($StatusCode -eq 404) {
    Write-ColorOutput "✗ Status 404 - Document not found" -Color Yellow
    Write-Host "  (This is expected if the Document ID is invalid or doesn't exist)"
    
} elseif ($StatusCode -eq 403) {
    Write-ColorOutput "✗ Status 403 - Unauthorized" -Color Yellow
    Write-Host "  (This is expected if you're not the document owner)"
    
} elseif ($StatusCode -eq 401) {
    Write-ColorOutput "✗ Status 401 - Unauthorized (Invalid JWT)" -Color Red
    Write-Host "  (Check that your JWT token is valid)"
    
} else {
    Write-ColorOutput "✗ Status $StatusCode - Unexpected response" -Color Red
}

Write-Host ""
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
Write-ColorOutput "Test Complete" -Color Cyan
Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
