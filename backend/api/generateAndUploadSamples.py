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
site_hostname = "juggernautenterprises.sharepoint.com"
site_path = "/sites/TestCloud"
doc_library = "TestClient"
fy_year = "TestClient_FY25"
folder_name = "tools"
sub_folder_name = "Confirmation"

# Helper function to get area code from sections data
def get_area_code_from_sections(sections_data, area_name):
    """Get area code from sections.json data"""
    if not sections_data:
        return None
    
    # Search in all categories (Planning, Execution, ConcludingProcedures)
    for category in sections_data.values():
        if isinstance(category, dict):
            for section_name, section_code in category.items():
                if section_name == area_name:
                    return section_code
    return None

# Cache for sections data
_sections_cache = None
_sections_cache_time = None
CACHE_DURATION = 300  # 5 minutes

def get_sections_data():
    """Fetch sections data from SharePoint with caching"""
    global _sections_cache, _sections_cache_time
    import time
    
    # Return cached data if still valid
    if _sections_cache and _sections_cache_time:
        if time.time() - _sections_cache_time < CACHE_DURATION:
            return _sections_cache
    
    try:
        # Configuration for Sections.json
        sections_doc_library = "Test15"
        sections_fy_year = "Test15_FY25"
        sections_folder_name = "juggernaut"
        sections_file_name = "Sections.json"
        
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
        drive_id = next((d["id"] for d in drives if d["name"] == sections_doc_library), None)
        
        if not drive_id:
            print(f"⚠️ Library '{sections_doc_library}' not found, using empty sections")
            return {}
        
        # Download file from SharePoint
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{sections_fy_year}/{sections_folder_name}/{sections_file_name}:/content"
        
        download_resp = requests.get(download_url, headers=headers)
        download_resp.raise_for_status()
        sections_data = download_resp.json()
        
        # Cache the data
        _sections_cache = sections_data
        _sections_cache_time = time.time()
        
        print(f"✅ Loaded sections data from SharePoint")
        return sections_data
    except Exception as e:
        print(f"⚠️ Error fetching sections data: {str(e)}, using empty dict")
        return {}

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
# GENERATE SAMPLE IDS
# ======================================
def generate_ssid(area, name, num):
    # Get area code from sections data
    sections_data = get_sections_data()
    area_code = get_area_code_from_sections(sections_data, area)
    if not area_code:
        raise ValueError(f"Invalid area name provided: {area}. Area not found in Sections.json")

    cleaned_name = name.replace(" ", "")
    name_prefix = cleaned_name[:2].upper()

    ids = []
    for i in range(1, num + 1):
        serial = str(i).zfill(3)
        ids.append(f"{area_code}_{name_prefix}_{serial}")
    return ids

# ======================================
# CREATE JSON DATA
# ======================================
def create_json_data(area, name, num, conf_name_list, amt_list, recipient_name_list=None, recipient_email_list=None):
    if len(conf_name_list) != num or len(amt_list) != num:
        raise ValueError("Length of conf_name and amt lists must match 'num'")

    # Validate area and compute area code from sections data
    sections_data = get_sections_data()
    area_code = get_area_code_from_sections(sections_data, area)
    if not area_code:
        raise ValueError(f"Invalid area name provided: {area}. Area not found in Sections.json")

    ssids = generate_ssid(area, name, num)
    data = {}

    for idx, ssid in enumerate(ssids):
        data[ssid] = {
            "partydetails": {
                "ConfirmingParty": conf_name_list[idx],
                "Recipientname": recipient_name_list[idx] if recipient_name_list and idx < len(recipient_name_list) else "",
                "RecipientEmail": recipient_email_list[idx] if recipient_email_list and idx < len(recipient_email_list) else "",
                "area": area,
                "amount": str(amt_list[idx]),
                "clientName": "",
                "clientEmail": "",
                "periodenddate": "",
                "templatename": ""
            },
            "templateDetails": {},
            "activityLog": [
                {
                    "timestamp": "",
                    "stage": "",
                    "action": "",
                    "performedBy": "",
                    "details": "",
                    "status": ""
                },
                {
                    "timestamp": "",
                    "stage": "",
                    "action": "",
                    "performedBy": "",
                    "details": "",
                    "status": ""
                }
            ],
            "domaintesting": {
                "Domain": "",
                "Status": "",
                "Creation Date": "",
                "Expiry Date": "",
                "Registrar": "",
                "result": ""
            }
        }

    return data

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
# API ENDPOINT: GENERATE AND UPLOAD SAMPLES
# ======================================
@app.route('/api/generate-and-upload-samples', methods=['POST'])
def generate_and_upload_samples():
    try:
        data = request.json
        samples = data.get('samples', [])  # Array of sample objects
        audit_area = data.get('auditArea')
        sample_set_name = data.get('sampleSetName')  # This is the "name" parameter

        if not samples or not audit_area or not sample_set_name:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'samples, auditArea, and sampleSetName are required'
            }), 400

        print(f"🚀 Starting to generate and upload {len(samples)} samples")

        # Extract data from samples
        conf_name_list = [s.get('confirmingParty', '') for s in samples]
        amt_list = [s.get('amount', '') for s in samples]
        recipient_name_list = [s.get('recipientName', '') for s in samples]
        recipient_email_list = [s.get('recipientEmail', '') for s in samples]

        # Convert amounts to numbers (handle string amounts)
        amt_list = [float(str(amt).replace(',', '')) if amt else 0 for amt in amt_list]

        # Get area code for filename
        # Get area code from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, audit_area) or "UNKNOWN"
        output_filename = f"confirmation_{area_code}.json"
        section_list = [f"confirmation_{area_code}"]

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

        # Download existing JSON file if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        temp_file_path = os.path.join(script_dir, output_filename)
        
        existing_data = {}
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # File exists, download and load it
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                # Convert to dict format if it's a list
                if isinstance(existing_data, list):
                    existing_data = {entry.get("sample_id", f"temp_{i}"): {k: v for k, v in entry.items() if k != "sample_id"} for i, entry in enumerate(existing_data)}
                    print("✅ Converted existing list format to dict format")
                
                print(f"✅ Loaded existing JSON file with {len(existing_data)} samples")
            else:
                print(f"ℹ️ File does not exist yet, will create new file")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (will create new): {str(e)}")

        # Generate sample IDs, checking against existing data to avoid duplicates
        cleaned_name = sample_set_name.replace(" ", "")
        name_prefix = cleaned_name[:2].upper()
        prefix = f"{area_code}_{name_prefix}_"
        
        # Find the highest existing number for this prefix
        existing_numbers = []
        for existing_id in existing_data.keys():
            if existing_id.startswith(prefix):
                try:
                    num_part = existing_id.split("_")[-1]
                    existing_numbers.append(int(num_part))
                except:
                    continue
        
        # Start from the next available number
        start_num = max(existing_numbers) + 1 if existing_numbers else 1
        
        # Generate new sample IDs
        new_sample_ids = []
        for i in range(len(samples)):
            serial = str(start_num + i).zfill(3)
            new_sample_ids.append(f"{prefix}{serial}")

        # Create JSON data with the new IDs
        json_data = {}
        for idx, sample_id in enumerate(new_sample_ids):
            json_data[sample_id] = {
                "partydetails": {
                    "ConfirmingParty": conf_name_list[idx],
                    "Recipientname": recipient_name_list[idx] if recipient_name_list and idx < len(recipient_name_list) else "",
                    "RecipientEmail": recipient_email_list[idx] if recipient_email_list and idx < len(recipient_email_list) else "",
                    "area": audit_area,
                    "amount": str(amt_list[idx]),
                    "clientName": "",
                    "clientEmail": "",
                    "periodenddate": "",
                    "templatename": ""
                },
                "templateDetails": {},
                "activityLog": [
                    {
                        "timestamp": "",
                        "stage": "",
                        "action": "",
                        "performedBy": "",
                        "details": "",
                        "status": ""
                    },
                    {
                        "timestamp": "",
                        "stage": "",
                        "action": "",
                        "performedBy": "",
                        "details": "",
                        "status": ""
                    }
                ],
                "domaintesting": {
                    "Domain": "",
                    "Status": "",
                    "Creation Date": "",
                    "Expiry Date": "",
                    "Registrar": "",
                    "result": ""
                }
            }

        # Merge new samples with existing data (append, don't overwrite)
        merged_data = existing_data.copy()
        for sample_id, sample_data in json_data.items():
            merged_data[sample_id] = sample_data
            print(f"➕ Added sample → {sample_id}")

        # Save merged JSON to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(merged_data, f, indent=4)

        print(f"✅ Created/Updated JSON file: {output_filename} with {len(merged_data)} total samples")

        # Upload to SharePoint
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

        # Get generated sample IDs
        generated_ids = list(json_data.keys())

        print(f"🎉 Successfully generated and uploaded {len(samples)} samples")
        return jsonify({
            'success': True,
            'message': f'Successfully generated and uploaded {len(samples)} samples',
            'generatedIds': generated_ids,
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to generate and upload samples',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=3002, debug=True)

