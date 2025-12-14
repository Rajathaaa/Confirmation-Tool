import requests
import json
from msal import ConfidentialClientApplication
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ======================================
# CONFIGURATION
# ======================================
tenant_id = "114c8106-747f-4cc7-870e-8712e6c23b18"
client_id = "b357e50c-c5ef-484d-84df-fe470fe76528"
client_secret = "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE"

site_hostname = "juggernautenterprises.sharepoint.com"
site_path = "/sites/TestCloud"
doc_library = "TestClient"
fy_year = "TestClient_FY25"
folder_name = "tools/Confirmation"

# Area mapping
AREA_MAP = {
    "Trade Receivables": "TR",
    "Cash & Cash Equivalents": "CCE",
    "Trade Payables": "TP",
    "Other Current Assets": "OCA",
    "Inventory": "INV",
    "Fixed Assets": "FA",
    "Investments": "INST",
    "Loans & Advances": "LA"
}

# ======================================
# SHAREPOINT AUTH
# ======================================
def get_access_token():
    app_msal = ConfidentialClientApplication(
        client_id,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
        client_credential=client_secret
    )
    token_response = app_msal.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    access_token = token_response.get("access_token")
    if not access_token:
        raise Exception("Failed to acquire access token")
    return access_token

# ======================================
# API ENDPOINT: GET CONFIRMATION DATA BY AREA
# ======================================
@app.route('/api/get-confirmation-by-area', methods=['POST'])
def get_confirmation_by_area():
    try:
        data = request.json
        area = data.get('area')

        if not area:
            return jsonify({
                'error': 'Missing required field',
                'message': 'area is required'
            }), 400

        area_code = AREA_MAP.get(area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}'
            }), 400

        file_name = f"confirmation_{area_code}.json"
        print(f"🚀 Downloading confirmation file: {file_name} for area: {area} ({area_code})")

        # Get access token
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_url = f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}"
        site_resp = requests.get(site_url, headers=headers)
        site_resp.raise_for_status()
        site_id = site_resp.json()["id"]

        # Get drive ID
        drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers)
        drives_resp.raise_for_status()
        drives = drives_resp.json()["value"]
        drive_id = next((d["id"] for d in drives if d["name"] == doc_library), None)

        if not drive_id:
            raise Exception(f"Library '{doc_library}' not found in site '{site_path}'")

        # Download file from SharePoint
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Read the JSON content
            confirmation_data = download_resp.json()
            
            # Handle both dict and list formats
            if isinstance(confirmation_data, list):
                # Convert list to dict format
                confirmation_data = {entry.get("sample_id", f"temp_{i}"): {k: v for k, v in entry.items() if k != "sample_id"} for i, entry in enumerate(confirmation_data)}
                print("✅ Converted list format to dict format")
            
            print(f"✅ Successfully downloaded {file_name} with {len(confirmation_data)} samples")
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded confirmation data for {area}',
                'data': confirmation_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return empty data
                print(f"ℹ️ File {file_name} does not exist on SharePoint")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist',
                    'data': {},
                    'filename': file_name
                })
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get confirmation data',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=3004, debug=True)

