#!/bin/bash
# Cycle 3 Testing Script - Automated testing of version rollback functionality
# This script tests the complete CRUD and rollback features as described in your requirements

echo "=== Indigenous Art Atlas - Cycle 3 Testing ==="
echo ""

BASE_URL="http://localhost:8000"
ARTS_API="$BASE_URL/api/arts.php"
VERSIONS_API="$BASE_URL/api/art_versions.php"

echo "🧪 Testing complete CRUD with version tracking..."
echo ""

# Function to make API calls and display results
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4

    echo "📡 $description"
    echo "   $method $url"
    if [ -n "$data" ]; then
        echo "   Data: $data"
    fi

    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s -X "$method" "$url")
    fi

    echo "   Response: $response"
    echo ""

    # Extract ID from response if it's a creation
    if [[ "$response" == *'"id":'* ]]; then
        ART_ID=$(echo "$response" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
        VERSION_ID=$(echo "$response" | grep -o '"version_id":[0-9]*' | grep -o '[0-9]*' | tail -1)
    fi
}

echo "Step 1: Create a new artwork"
api_call "POST" "$ARTS_API" '{"title":"Demo Artwork","type":"Mural","period":"Contemporary","condition":"Good","description":"Sample artwork for testing"}' "Creating new artwork"

if [ -z "$ART_ID" ]; then
    echo "❌ Failed to create artwork. Please check if the server is running and database is configured."
    exit 1
fi

echo "✅ Created artwork with ID: $ART_ID"
echo ""

echo "Step 2: Get artwork details (check current version)"
api_call "GET" "$ARTS_API?id=$ART_ID" "" "Getting artwork details"

echo "Step 3: Update the artwork (create version 2)"
api_call "PUT" "$ARTS_API?id=$ART_ID" '{"title":"Updated Demo Artwork"}' "Updating artwork title"

echo "Step 4: Update again (create version 3)"
api_call "PUT" "$ARTS_API?id=$ART_ID" '{"description":"Updated description for testing rollback functionality"}' "Updating artwork description"

echo "Step 5: Check version history"
api_call "GET" "$VERSIONS_API?art_id=$ART_ID" "" "Getting version history"

echo "Step 6: Test full rollback to version 1"
if [ -n "$VERSION_ID" ]; then
    api_call "POST" "$VERSIONS_API?action=rollback" "{\"art_id\":$ART_ID,\"target_version\":1,\"rollback_type\":\"full\",\"reason\":\"test full rollback\",\"expected_current_version_id\":$VERSION_ID}" "Rolling back to version 1 (full)"
else
    api_call "POST" "$VERSIONS_API?action=rollback" "{\"art_id\":$ART_ID,\"target_version\":1,\"rollback_type\":\"full\",\"reason\":\"test full rollback\"}" "Rolling back to version 1 (full)"
fi

echo "Step 7: Verify rollback - check current state"
api_call "GET" "$ARTS_API?id=$ART_ID" "" "Verifying rollback result"

echo "Step 8: Test selective rollback (title only)"
api_call "POST" "$VERSIONS_API?action=rollback" "{\"art_id\":$ART_ID,\"target_version\":2,\"rollback_type\":\"selective\",\"fields\":[\"title\"],\"reason\":\"rollback title only\"}" "Rolling back title to version 2 (selective)"

echo "Step 9: Check final state"
api_call "GET" "$ARTS_API?id=$ART_ID" "" "Getting final artwork state"

echo "Step 10: View complete version history"
api_call "GET" "$VERSIONS_API?art_id=$ART_ID" "" "Getting complete version history"

echo ""
echo "🎉 Testing completed!"
echo ""
echo "Expected results:"
echo "- ✅ Artwork created with version 1"
echo "- ✅ Updates created versions 2 and 3"
echo "- ✅ Full rollback created version 4 (content = version 1)"
echo "- ✅ Selective rollback created version 5 (title from v2, other fields from v4)"
echo "- ✅ All operations recorded in version history"
echo ""
echo "This demonstrates:"
echo "📋 Complete CRUD operations with database persistence"
echo "🔄 Automatic version tracking on every change"
echo "↩️  Full and selective rollback capabilities"
echo "📚 Complete audit trail of all operations"
echo ""
echo "Perfect for Cycle 3 demonstration! 🚀"