import requests
import json
import os
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

site_name = "TestCloud"
doc_library = "TestClient"
fy_year = "TestClient_FY25"
folder_name = "tools"
sub_folder_name = "Confirmation"

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

DEFAULT_STRUCTURE = {
    "TR": [],
    "CCE": [],
    "TP": [],
    "OCA": [],
    "INV": [],
    "FA": [],
    "INST": [],
    "LA": []
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
# UPLOAD TO SHAREPOINT (JUGG FUNCTION)
# ======================================
def jugg(file_path, reference_value, folder_name, sub_folder_name, fy_year, section_list, headers, site_id, drive_id):
    """
    Uploads a file to SharePoint, updates db.json, and appends or overwrites
    an entry with: name, url, reference, and section list.
    """
    target_file_name = os.path.basename(file_path)

    # Upload file
    upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{target_file_name}:/content"

    with open(file_path, "rb") as f:
        file_content = f.read()

    upload_resp = requests.put(upload_url, headers=headers, data=file_content)
    upload_resp.raise_for_status()
    file_web_url = upload_resp.json().get("webUrl")

    # Download current db.json
    db_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"
    db_resp = requests.get(db_url, headers=headers)

    if db_resp.status_code == 200:
        db_data = db_resp.json()
    else:
        db_data = {"juggernaut": [], "client": [], "tools": {"Confirmation": []}, "rbin": []}

    # Prepare new entry
    new_entry = {
        "name": target_file_name,
        "url": file_web_url,
        "reference": reference_value,
        "section": section_list
    }

    # Ensure nested structure exists
    if "tools" not in db_data:
        db_data["tools"] = {}

    if "Confirmation" not in db_data["tools"]:
        db_data["tools"]["Confirmation"] = []

    entries = db_data["tools"]["Confirmation"]

    # Make sure entries is always a list of dicts
    if not isinstance(entries, list):
        db_data["tools"]["Confirmation"] = []
        entries = db_data["tools"]["Confirmation"]

    # Append or overwrite
    found = False
    for i, entry in enumerate(entries):
        if isinstance(entry, dict) and entry.get("name") == target_file_name:
            db_data["tools"]["Confirmation"][i] = new_entry  # overwrite
            found = True
            print(f"Overwriting existing entry for '{target_file_name}'")
            break

    if not found:
        db_data["tools"]["Confirmation"].append(new_entry)
        print(f"Added new entry for '{target_file_name}'")

    # Upload updated db.json
    updated_db_content = json.dumps(db_data, indent=4)
    db_upload_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/juggernaut/db.json:/content"

    db_upload_resp = requests.put(db_upload_url, headers=headers, data=updated_db_content.encode("utf-8"))
    db_upload_resp.raise_for_status()

    print(f"✅ Successfully uploaded {target_file_name} and updated db.json")
    return file_web_url

# ======================================
# API ENDPOINT: APPEND SAMPLE SET TO AREA
# ======================================
@app.route('/api/append-sample-set-to-area', methods=['POST'])
def append_sample_set_to_area():
    try:
        data = request.json
        area = data.get('area')
        sample_set_name = data.get('sampleSetName')

        if not area or not sample_set_name:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'area and sampleSetName are required'
            }), 400

        area_code = AREA_MAP.get(area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}'
            }), 400

        print(f"🚀 Starting to append sample set '{sample_set_name}' to area '{area}' ({area_code})")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/juggernautenterprises.sharepoint.com:/sites/{site_name}",
            headers=headers
        )
        site_resp.raise_for_status()
        site_id = site_resp.json()["id"]

        # Get drive ID
        drives_resp = requests.get(f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives", headers=headers)
        drives_resp.raise_for_status()
        drives = drives_resp.json()["value"]
        drive_id = next((d["id"] for d in drives if d["name"] == doc_library), None)

        if not drive_id:
            raise Exception(f"Library '{doc_library}' not found on site '{site_name}'")

        # Download existing audit_areas.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "audit_areas.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or use default structure
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)  # Remove if exists locally
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # File exists, download and load it
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    data_dict = json.load(f)
                
                print(f"✅ Loaded existing audit_areas.json")
            else:
                # File doesn't exist, use default structure
                data_dict = DEFAULT_STRUCTURE.copy()
                print(f"ℹ️ File does not exist, using default structure")
        except Exception as e:
            # File doesn't exist or error downloading, use default structure
            data_dict = DEFAULT_STRUCTURE.copy()
            print(f"ℹ️ Could not download existing file (using default): {str(e)}")

        # Ensure the area code exists in the data
        if area_code not in data_dict:
            data_dict[area_code] = []

        # Append sample set name if it doesn't already exist
        if sample_set_name not in data_dict[area_code]:
            data_dict[area_code].append(sample_set_name)
            print(f"➕ Added '{sample_set_name}' to {area_code}")
        else:
            print(f"ℹ️ '{sample_set_name}' already exists in {area_code}")

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(data_dict, f, indent=4)

        print(f"✅ Updated audit_areas.json")

        # Upload to SharePoint
        section_list = ["audit_areas"]
        file_web_url = jugg(
            file_path=temp_file_path,
            reference_value="",
            folder_name=folder_name,
            sub_folder_name=sub_folder_name,
            fy_year=fy_year,
            section_list=section_list,
            headers=headers,
            site_id=site_id,
            drive_id=drive_id
        )

        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        print(f"🎉 Successfully appended sample set to audit_areas.json")
        return jsonify({
            'success': True,
            'message': f'Successfully added sample set "{sample_set_name}" to area "{area}"',
            'filename': output_filename,
            'fileUrl': file_web_url,
            'data': data_dict
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to append sample set to area',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=3003, debug=True)

