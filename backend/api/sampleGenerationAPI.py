import requests
import json
import os
from datetime import datetime
from msal import ConfidentialClientApplication
from flask import Flask, request, jsonify
from flask_cors import CORS
import whois

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
# CLEAN TEMPLATE DETAILS - Remove type specifications
# ======================================
def clean_template_details(template_details):
    """
    Recursively clean templateDetails to remove type specifications and keep only user inputs.
    Returns a cleaned structure with only actual values (strings, numbers), never type objects.
    """
    if template_details is None:
        return {}
    
    cleaned = {}
    
    for key, value in template_details.items():
        # Skip system fields - handle separately
        if key in ['remarks', 'attachments', 'confirmingpartystatement', 'confirmingpartydetails', 'actions']:
            cleaned[key] = value
            continue
        
        # Handle textboxes
        if key.startswith('textbox_'):
            if isinstance(value, str):
                cleaned[key] = value
            elif isinstance(value, dict):
                # Textbox with heading/description - keep structure but clean value
                cleaned[key] = {
                    'heading': value.get('heading', ''),
                    'description': value.get('description', ''),
                    'value': value.get('value', '')
                }
            else:
                cleaned[key] = value
        
        # Handle tables
        elif key.startswith('table_'):
            if isinstance(value, dict) and 'rows' in value:
                cleaned_table = {
                    'heading': value.get('heading', ''),
                    'subheading': value.get('subheading', ''),
                    'footnote': value.get('footnote', ''),
                    'columns': value.get('columns', []),
                    'rows': [],
                    'addRow': value.get('addRow', False)
                }
                
                # Clean rows - remove type specs, keep only values
                for row in value.get('rows', []):
                    if isinstance(row, dict):
                        cleaned_row = {}
                        for col in cleaned_table['columns']:
                            cell_value = row.get(col)
                            # If it's a type spec object, replace with empty string
                            if isinstance(cell_value, dict) and 'type' in cell_value:
                                cleaned_row[col] = ""
                            # If it's a string/number, keep it
                            elif isinstance(cell_value, (str, int, float)) and cell_value != "":
                                cleaned_row[col] = cell_value
                            # If it's a pre-filled string (like "Sl. No.": "1."), keep it
                            elif isinstance(cell_value, str):
                                cleaned_row[col] = cell_value
                            # Otherwise empty string
                            else:
                                cleaned_row[col] = ""
                        cleaned_table['rows'].append(cleaned_row)
                    else:
                        cleaned_table['rows'].append(row)
                
                cleaned[key] = cleaned_table
            else:
                cleaned[key] = value
        
        # Handle questions
        elif key.startswith('question_'):
            if isinstance(value, dict):
                cleaned_question = {
                    'statement': value.get('statement', ''),
                    'response': '',
                    'type': value.get('type', '')
                }
                
                # Clean response - if it's a type object, use empty string; otherwise use the value
                response = value.get('response', '')
                if isinstance(response, dict) and 'type' in response:
                    cleaned_question['response'] = ""
                elif isinstance(response, str):
                    cleaned_question['response'] = response
                else:
                    cleaned_question['response'] = ""
                
                # Handle conditional tables
                if 'conditional' in value and isinstance(value['conditional'], dict):
                    cleaned_conditional = {
                        'showIf': value['conditional'].get('showIf', '')
                    }
                    
                    for cond_key, cond_value in value['conditional'].items():
                        if cond_key != 'showIf' and cond_key.startswith('table_'):
                            if isinstance(cond_value, dict) and 'rows' in cond_value:
                                cleaned_cond_table = {
                                    'heading': cond_value.get('heading', ''),
                                    'columns': cond_value.get('columns', []),
                                    'rows': []
                                }
                                
                                # Clean conditional table rows
                                for row in cond_value.get('rows', []):
                                    if isinstance(row, dict):
                                        cleaned_row = {}
                                        for col in cleaned_cond_table['columns']:
                                            cell_value = row.get(col)
                                            # If type spec, replace with empty string
                                            if isinstance(cell_value, dict) and 'type' in cell_value:
                                                cleaned_row[col] = ""
                                            # If string/number, keep it
                                            elif isinstance(cell_value, (str, int, float)) and cell_value != "":
                                                cleaned_row[col] = cell_value
                                            # If pre-filled string, keep it
                                            elif isinstance(cell_value, str):
                                                cleaned_row[col] = cell_value
                                            # Otherwise empty
                                            else:
                                                cleaned_row[col] = ""
                                        cleaned_cond_table['rows'].append(cleaned_row)
                                    else:
                                        cleaned_cond_table['rows'].append(row)
                                
                                cleaned_conditional[cond_key] = cleaned_cond_table
                            else:
                                cleaned_conditional[cond_key] = cond_value
                        else:
                            cleaned_conditional[cond_key] = cond_value
                    
                    cleaned_question['conditional'] = cleaned_conditional
                
                cleaned[key] = cleaned_question
            else:
                cleaned[key] = value
        
        # Handle other fields
        else:
            cleaned[key] = value
    
    return cleaned

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
# API ENDPOINT 1: APPEND SAMPLE SET TO AREA
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

        # Get area code from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}. Area not found in Sections.json'
            }), 400

        print(f"🚀 Starting to append sample set '{sample_set_name}' to area '{area}' ({area_code})")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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
        
        # Convert old string list format to new object format if needed
        if isinstance(data_dict[area_code], list):
            converted_list = []
            for item in data_dict[area_code]:
                if isinstance(item, str):
                    # Old format: just a string, convert to new format
                    converted_list.append({item: {"locked": False}})
                elif isinstance(item, dict):
                    # Already in new format
                    converted_list.append(item)
            data_dict[area_code] = converted_list

        # Check if sample set already exists
        sample_set_exists = False
        for item in data_dict[area_code]:
            if isinstance(item, dict) and sample_set_name in item:
                sample_set_exists = True
                break
        
        # Add sample set name if it doesn't already exist
        if not sample_set_exists:
            data_dict[area_code].append({sample_set_name: {"locked": False}})
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

# ======================================
# API ENDPOINT 2: GET CONFIRMATION DATA BY AREA
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

        # Get area code from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}. Area not found in Sections.json'
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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
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

# ======================================
# API ENDPOINT 3: GENERATE AND UPLOAD SAMPLES
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

        # Get area code for filename from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, audit_area) or "UNKNOWN"
        output_filename = f"confirmation_{area_code}.json"
        section_list = [f"confirmation_{area_code}"]

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

# ======================================
# API ENDPOINT 4: GET AUDIT AREAS JSON
# ======================================
@app.route('/api/get-audit-areas', methods=['GET'])
def get_audit_areas():
    try:
        file_name = "audit_areas.json"
        print(f"🚀 Downloading audit_areas.json from SharePoint")

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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Handle binary download
            script_dir = os.path.dirname(os.path.abspath(__file__))
            temp_file_path = os.path.join(script_dir, file_name)
            with open(temp_file_path, "wb") as f:
                f.write(download_resp.content)
            
            with open(temp_file_path, "r", encoding="utf-8") as f:
                audit_areas_data = json.load(f)
            
            # Convert old string list format to new object format if needed
            for area_code in audit_areas_data:
                if isinstance(audit_areas_data[area_code], list):
                    converted_list = []
                    for item in audit_areas_data[area_code]:
                        if isinstance(item, str):
                            # Old format: just a string, convert to new format
                            converted_list.append({item: {"locked": False}})
                        elif isinstance(item, dict):
                            # Already in new format
                            converted_list.append(item)
                    audit_areas_data[area_code] = converted_list
            
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            
            print(f"✅ Successfully downloaded {file_name}")
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded audit_areas.json',
                'data': audit_areas_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return default structure
                print(f"ℹ️ File {file_name} does not exist on SharePoint, returning default structure")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist, returning default structure',
                    'data': DEFAULT_STRUCTURE,
                    'filename': file_name
                })
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get audit areas',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 5: DELETE SAMPLE SET FROM AREA
# ======================================
@app.route('/api/delete-sample-set-from-area', methods=['POST'])
def delete_sample_set_from_area():
    try:
        data = request.json
        area = data.get('area')
        sample_set_name = data.get('sampleSetName')

        if not area or not sample_set_name:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'area and sampleSetName are required'
            }), 400

        # Get area code from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}. Area not found in Sections.json'
            }), 400

        print(f"🚀 Starting to delete sample set '{sample_set_name}' from area '{area}' ({area_code})")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing audit_areas.json
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "audit_areas.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data
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
                # File doesn't exist, return error
                return jsonify({
                    'error': 'File not found',
                    'message': f'audit_areas.json does not exist on SharePoint'
                }), 404
        except Exception as e:
            return jsonify({
                'error': 'Failed to download file',
                'message': str(e)
            }), 500

        # Ensure the area code exists in the data
        if area_code not in data_dict:
            return jsonify({
                'error': 'Area not found',
                'message': f'Area code {area_code} not found in audit_areas.json'
            }), 404

        # Convert old string list format to new object format if needed
        if isinstance(data_dict[area_code], list):
            converted_list = []
            for item in data_dict[area_code]:
                if isinstance(item, str):
                    # Old format: just a string, convert to new format
                    converted_list.append({item: {"locked": False}})
                elif isinstance(item, dict):
                    # Already in new format
                    converted_list.append(item)
            data_dict[area_code] = converted_list

        # Remove sample set name if it exists
        original_length = len(data_dict[area_code])
        data_dict[area_code] = [
            item for item in data_dict[area_code]
            if not (isinstance(item, dict) and sample_set_name in item)
        ]
        
        if len(data_dict[area_code]) < original_length:
            print(f"➖ Removed '{sample_set_name}' from {area_code}")
        else:
            print(f"ℹ️ '{sample_set_name}' not found in {area_code}")

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

        # Now delete related samples from confirmation JSON file
        confirmation_filename = f"confirmation_{area_code}.json"
        confirmation_file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{confirmation_filename}"
        confirmation_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{confirmation_file_path_on_sharepoint}:/content"
        
        # Get sample set name abbreviation (first 2 chars after removing spaces)
        cleaned_name = sample_set_name.replace(" ", "")
        name_prefix = cleaned_name[:2].upper()
        sample_prefix = f"{area_code}_{name_prefix}_"
        
        print(f"🔍 Looking for samples with prefix '{sample_prefix}' in {confirmation_filename}")
        
        deleted_samples_count = 0
        try:
            # Download existing confirmation JSON file
            confirmation_download_resp = requests.get(confirmation_download_url, headers=headers)
            if confirmation_download_resp.status_code == 200:
                # File exists, download and load it
                confirmation_temp_file_path = os.path.join(script_dir, confirmation_filename)
                with open(confirmation_temp_file_path, "wb") as f:
                    f.write(confirmation_download_resp.content)
                
                with open(confirmation_temp_file_path, "r", encoding="utf-8") as f:
                    confirmation_data = json.load(f)
                
                # Convert to dict format if it's a list
                if isinstance(confirmation_data, list):
                    confirmation_data = {entry.get("sample_id", f"temp_{i}"): {k: v for k, v in entry.items() if k != "sample_id"} for i, entry in enumerate(confirmation_data)}
                    print("✅ Converted confirmation list format to dict format")
                
                # Find and delete all samples with matching prefix
                samples_to_delete = [sample_id for sample_id in confirmation_data.keys() if sample_id.startswith(sample_prefix)]
                
                if samples_to_delete:
                    for sample_id in samples_to_delete:
                        del confirmation_data[sample_id]
                        deleted_samples_count += 1
                        print(f"➖ Deleted sample: {sample_id}")
                    
                    # Save updated confirmation data
                    with open(confirmation_temp_file_path, "w", encoding="utf-8") as f:
                        json.dump(confirmation_data, f, indent=4)
                    
                    print(f"✅ Updated {confirmation_filename} - removed {deleted_samples_count} samples")
                    
                    # Upload updated confirmation file to SharePoint
                    confirmation_section_list = [f"confirmation_{area_code}"]
                    confirmation_file_web_url = jugg(
                        file_path=confirmation_temp_file_path,
                        reference_value="",
                        folder_name=folder_name,
                        sub_folder_name=sub_folder_name,
                        fy_year=fy_year,
                        section_list=confirmation_section_list,
                        headers=headers,
                        site_id=site_id,
                        drive_id=drive_id
                    )
                    
                    # Clean up temp file
                    if os.path.exists(confirmation_temp_file_path):
                        os.remove(confirmation_temp_file_path)
                    
                    print(f"✅ Successfully uploaded updated {confirmation_filename}")
                else:
                    print(f"ℹ️ No samples found with prefix '{sample_prefix}' in {confirmation_filename}")
            else:
                print(f"ℹ️ Confirmation file {confirmation_filename} does not exist, skipping sample deletion")
        except Exception as e:
            print(f"⚠️ Warning: Could not delete samples from confirmation file: {str(e)}")
            # Don't fail the entire operation if confirmation file deletion fails
            import traceback
            traceback.print_exc()

        # Now delete related sampling log from sampling_log.json
        sampling_log_filename = "sampling_log.json"
        sampling_log_file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{sampling_log_filename}"
        sampling_log_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{sampling_log_file_path_on_sharepoint}:/content"
        
        print(f"🔍 Looking for sampling log for '{sample_set_name}' in {sampling_log_filename}")
        
        try:
            # Download existing sampling_log.json file
            sampling_log_download_resp = requests.get(sampling_log_download_url, headers=headers)
            if sampling_log_download_resp.status_code == 200:
                # File exists, download and load it
                sampling_log_temp_file_path = os.path.join(script_dir, sampling_log_filename)
                with open(sampling_log_temp_file_path, "wb") as f:
                    f.write(sampling_log_download_resp.content)
                
                with open(sampling_log_temp_file_path, "r", encoding="utf-8") as f:
                    sampling_log_data = json.load(f)
                
                # Check if area exists and sample set name exists in the area
                if area in sampling_log_data and sample_set_name in sampling_log_data[area]:
                    # Delete the sample set entry from sampling log
                    del sampling_log_data[area][sample_set_name]
                    print(f"➖ Deleted sampling log for sample set: {sample_set_name}")
                    
                    # If the area is now empty, remove it
                    if not sampling_log_data[area]:
                        del sampling_log_data[area]
                        print(f"➖ Removed empty area '{area}' from sampling log")
                    
                    # Save updated sampling log data
                    with open(sampling_log_temp_file_path, "w", encoding="utf-8") as f:
                        json.dump(sampling_log_data, f, indent=4)
                    
                    print(f"✅ Updated {sampling_log_filename}")
                    
                    # Upload updated sampling log file to SharePoint
                    sampling_log_section_list = ["sampling_log"]
                    sampling_log_file_web_url = jugg(
                        file_path=sampling_log_temp_file_path,
                        reference_value="",
                        folder_name=folder_name,
                        sub_folder_name=sub_folder_name,
                        fy_year=fy_year,
                        section_list=sampling_log_section_list,
                        headers=headers,
                        site_id=site_id,
                        drive_id=drive_id
                    )
                    
                    # Clean up temp file
                    if os.path.exists(sampling_log_temp_file_path):
                        os.remove(sampling_log_temp_file_path)
                    
                    print(f"✅ Successfully uploaded updated {sampling_log_filename}")
                else:
                    print(f"ℹ️ No sampling log found for sample set '{sample_set_name}' in area '{area}'")
            else:
                print(f"ℹ️ Sampling log file {sampling_log_filename} does not exist, skipping sampling log deletion")
        except Exception as e:
            print(f"⚠️ Warning: Could not delete sampling log: {str(e)}")
            # Don't fail the entire operation if sampling log deletion fails
            import traceback
            traceback.print_exc()

        # Now delete related authorization letters from authorization_letters.json
        authorization_letters_filename = "authorization_letters.json"
        authorization_letters_file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{authorization_letters_filename}"
        authorization_letters_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{authorization_letters_file_path_on_sharepoint}:/content"
        
        print(f"🔍 Looking for authorization letters with prefix '{sample_prefix}' in {authorization_letters_filename}")
        
        deleted_letters_count = 0
        try:
            # Download existing authorization_letters.json file
            authorization_letters_download_resp = requests.get(authorization_letters_download_url, headers=headers)
            if authorization_letters_download_resp.status_code == 200:
                # File exists, download and load it
                authorization_letters_temp_file_path = os.path.join(script_dir, authorization_letters_filename)
                with open(authorization_letters_temp_file_path, "wb") as f:
                    f.write(authorization_letters_download_resp.content)
                
                with open(authorization_letters_temp_file_path, "r", encoding="utf-8") as f:
                    authorization_letters_data = json.load(f)
                
                # Ensure letters list exists
                if "letters" not in authorization_letters_data:
                    authorization_letters_data["letters"] = []
                
                # Find and delete all letters with IDs matching the sample prefix
                original_letters_count = len(authorization_letters_data["letters"])
                authorization_letters_data["letters"] = [
                    letter for letter in authorization_letters_data["letters"]
                    if not (letter.get("id", "").startswith(sample_prefix))
                ]
                deleted_letters_count = original_letters_count - len(authorization_letters_data["letters"])
                
                if deleted_letters_count > 0:
                    print(f"➖ Deleted {deleted_letters_count} authorization letter(s) with prefix '{sample_prefix}'")
                    
                    # Save updated authorization letters data
                    with open(authorization_letters_temp_file_path, "w", encoding="utf-8") as f:
                        json.dump(authorization_letters_data, f, indent=4)
                    
                    print(f"✅ Updated {authorization_letters_filename} - removed {deleted_letters_count} letters")
                    
                    # Upload updated authorization letters file to SharePoint
                    authorization_letters_section_list = ["authorization_letters"]
                    authorization_letters_file_web_url = jugg(
                        file_path=authorization_letters_temp_file_path,
                        reference_value="",
                        folder_name=folder_name,
                        sub_folder_name=sub_folder_name,
                        fy_year=fy_year,
                        section_list=authorization_letters_section_list,
                        headers=headers,
                        site_id=site_id,
                        drive_id=drive_id
                    )
                    
                    # Clean up temp file
                    if os.path.exists(authorization_letters_temp_file_path):
                        os.remove(authorization_letters_temp_file_path)
                    
                    print(f"✅ Successfully uploaded updated {authorization_letters_filename}")
                else:
                    print(f"ℹ️ No authorization letters found with prefix '{sample_prefix}' in {authorization_letters_filename}")
            else:
                print(f"ℹ️ Authorization letters file {authorization_letters_filename} does not exist, skipping letter deletion")
        except Exception as e:
            print(f"⚠️ Warning: Could not delete authorization letters: {str(e)}")
            # Don't fail the entire operation if authorization letters deletion fails
            import traceback
            traceback.print_exc()

        print(f"🎉 Successfully deleted sample set from audit_areas.json")
        return jsonify({
            'success': True,
            'message': f'Successfully deleted sample set "{sample_set_name}" from area "{area}"',
            'filename': output_filename,
            'fileUrl': file_web_url,
            'data': data_dict,
            'deletedSamplesCount': deleted_samples_count,
            'deletedLettersCount': deleted_letters_count,
            'samplePrefix': sample_prefix
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to delete sample set from area',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 6: SAVE SAMPLING LOG
# ======================================
@app.route('/api/save-sampling-log', methods=['POST'])
def save_sampling_log():
    try:
        data = request.json
        area = data.get('area')
        sample_set_name = data.get('sampleSetName')
        log_data = data.get('logData')

        if not area or not sample_set_name or not log_data:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'area, sampleSetName, and logData are required'
            }), 400

        print(f"🚀 Saving sampling log for '{sample_set_name}' in area '{area}'")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing sampling_log.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "sampling_log.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {}
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # File exists, download and load it
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                print(f"✅ Loaded existing sampling_log.json")
            else:
                # File doesn't exist, create new structure
                existing_data = {}
                print(f"ℹ️ File does not exist, creating new structure")
        except Exception as e:
            # File doesn't exist or error downloading, create new structure
            existing_data = {}
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure the area exists in the data
        if area not in existing_data:
            existing_data[area] = {}

        # Ensure the sample set name exists in the area
        if sample_set_name not in existing_data[area]:
            existing_data[area][sample_set_name] = []

        # Map method to sampling type
        method = log_data.get('method', '')
        if method == 'number':
            sampling_type = "Simple Random Sampling"
        elif method == 'calculator':
            sampling_type = "Simple Random Sampling"
        elif method == 'mus':
            sampling_type = "Monetary Unit Sampling"
        else:
            sampling_type = "Unknown"

        # Map reliance on controls
        reliance_on_controls = log_data.get('relianceOnControls', '')
        if reliance_on_controls == 'relying':
            reliance_value = "Yes"
        elif reliance_on_controls == 'not-relying':
            reliance_value = "No"
        else:
            reliance_value = reliance_on_controls or ""

        # Map assessed risk
        assessed_risk = log_data.get('assessedRisk', '')
        assessed_risk_mapped = assessed_risk.capitalize() if assessed_risk else ""

        # Map type of items
        type_of_items = log_data.get('typeOfItems', '')
        type_of_items_mapped = type_of_items.capitalize() if type_of_items else ""

        # Format date_time (convert from ISO format to readable format)
        date_time_str = log_data.get('dateTime', '')
        try:
            # Parse ISO format and convert to readable format
            if date_time_str:
                dt = datetime.fromisoformat(date_time_str.replace('Z', '+00:00'))
                formatted_date_time = dt.strftime('%Y-%m-%d %H:%M')
            else:
                formatted_date_time = datetime.now().strftime('%Y-%m-%d %H:%M')
        except:
            formatted_date_time = date_time_str or datetime.now().strftime('%Y-%m-%d %H:%M')

        # Create log entry
        log_entry = {
            "sampling type": sampling_type,
            "date_time": formatted_date_time,
            "performance_materiality": log_data.get('performanceMateriality', 0),
            "assessed_risk": assessed_risk_mapped,
            "reliance_on_controls": reliance_value,
            "amount_column": log_data.get('amountColumn', ''),
            "type_of_items": type_of_items_mapped,
            "total_amount": log_data.get('totalAmount', 0),
            "net_population_subject_to_sampling": log_data.get('netPopulationSubjectToSampling', 0),
            "number_of_samples": log_data.get('calculatedNumberOfSamples') or log_data.get('numberOfSamples', 0),
            "high_value_samples": log_data.get('highValueSamples', 0) if method == 'mus' else 0
        }

        # Append log entry to the sample set
        existing_data[area][sample_set_name].append(log_entry)

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated sampling_log.json")

        # Upload to SharePoint
        section_list = ["sampling_log"]
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

        print(f"🎉 Successfully saved sampling log to SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully saved sampling log for "{sample_set_name}"',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to save sampling log',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 7: GET SAMPLING LOG
# ======================================
@app.route('/api/get-sampling-log', methods=['GET'])
def get_sampling_log():
    try:
        file_name = "sampling_log.json"
        print(f"🚀 Downloading sampling_log.json from SharePoint")

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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Read the JSON content
            sampling_log_data = download_resp.json()
            
            print(f"✅ Successfully downloaded {file_name}")
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded sampling_log.json',
                'data': sampling_log_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return empty structure
                print(f"ℹ️ File {file_name} does not exist on SharePoint, returning empty structure")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist, returning empty structure',
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
            'error': 'Failed to get sampling log',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 8: GET PEOPLE DATA
# ======================================
@app.route('/api/get-people-data', methods=['GET'])
def get_people_data():
    try:
        file_name = "people_data.json"
        print(f"🚀 Downloading {file_name} from SharePoint")

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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Read the JSON content
            people_data = download_resp.json()
            
            print(f"✅ Successfully downloaded {file_name}")
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded {file_name}',
                'data': people_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return empty structure
                print(f"ℹ️ File {file_name} does not exist on SharePoint, returning empty structure")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist, returning empty structure',
                    'data': {
                        'auditors': [],
                        'clients': [],
                        'confirming_parties': []
                    },
                    'filename': file_name
                })
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get people data',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 9: ADD AUDITOR
# ======================================
@app.route('/api/add-auditor', methods=['POST'])
def add_auditor():
    try:
        data = request.json
        auditor_data = data.get('auditor')

        if not auditor_data:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'auditor data is required'
            }), 400

        print(f"🚀 Adding auditor: {auditor_data.get('name', 'Unknown')}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing people_data.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "people_data.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {
            "auditors": [],
            "clients": [],
            "confirming_parties": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure auditors list exists
        if "auditors" not in existing_data:
            existing_data["auditors"] = []

        # Append new auditor
        existing_data["auditors"].append(auditor_data)

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["people_data"]
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

        print(f"🎉 Successfully added auditor to SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully added auditor',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to add auditor',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 10: ADD CLIENT
# ======================================
@app.route('/api/add-client', methods=['POST'])
def add_client():
    try:
        data = request.json
        client_data = data.get('client')

        if not client_data:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'client data is required'
            }), 400

        print(f"🚀 Adding client: {client_data.get('name', 'Unknown')}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing people_data.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "people_data.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {
            "auditors": [],
            "clients": [],
            "confirming_parties": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure clients list exists
        if "clients" not in existing_data:
            existing_data["clients"] = []

        # Append new client
        existing_data["clients"].append(client_data)

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["people_data"]
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

        print(f"🎉 Successfully added client to SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully added client',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to add client',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 11: ADD CONFIRMING PARTY
# ======================================
@app.route('/api/add-confirming-party', methods=['POST'])
def add_confirming_party():
    try:
        data = request.json
        confirming_party_data = data.get('confirmingParty')

        if not confirming_party_data:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'confirmingParty data is required'
            }), 400

        print(f"🚀 Adding confirming party: {confirming_party_data.get('organization', 'Unknown')}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing people_data.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "people_data.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {
            "auditors": [],
            "clients": [],
            "confirming_parties": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure confirming_parties list exists
        if "confirming_parties" not in existing_data:
            existing_data["confirming_parties"] = []

        # Append new confirming party
        existing_data["confirming_parties"].append(confirming_party_data)

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["people_data"]
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

        print(f"🎉 Successfully added confirming party to SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully added confirming party',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to add confirming party',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 12: DELETE AUDITOR
# ======================================
@app.route('/api/delete-auditor', methods=['POST'])
def delete_auditor():
    try:
        data = request.json
        auditor_email = data.get('email')

        if not auditor_email:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'email is required'
            }), 400

        print(f"🚀 Deleting auditor with email: {auditor_email}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing people_data.json
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "people_data.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        existing_data = {
            "auditors": [],
            "clients": [],
            "confirming_parties": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file: {str(e)}")
            return jsonify({
                'error': 'File not found',
                'message': 'people_data.json not found on SharePoint'
            }), 404

        # Remove auditor by email
        if "auditors" not in existing_data:
            existing_data["auditors"] = []

        original_count = len(existing_data["auditors"])
        existing_data["auditors"] = [a for a in existing_data["auditors"] if a.get("email") != auditor_email]
        deleted_count = original_count - len(existing_data["auditors"])

        if deleted_count == 0:
            return jsonify({
                'error': 'Not found',
                'message': f'Auditor with email {auditor_email} not found'
            }), 404

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["people_data"]
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

        print(f"🎉 Successfully deleted auditor from SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully deleted auditor',
            'filename': output_filename
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to delete auditor',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 13: DELETE CLIENT
# ======================================
@app.route('/api/delete-client', methods=['POST'])
def delete_client():
    try:
        data = request.json
        client_email = data.get('email')

        if not client_email:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'email is required'
            }), 400

        print(f"🚀 Deleting client with email: {client_email}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing people_data.json
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "people_data.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        existing_data = {
            "auditors": [],
            "clients": [],
            "confirming_parties": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file: {str(e)}")
            return jsonify({
                'error': 'File not found',
                'message': 'people_data.json not found on SharePoint'
            }), 404

        # Remove client by email
        if "clients" not in existing_data:
            existing_data["clients"] = []

        original_count = len(existing_data["clients"])
        existing_data["clients"] = [c for c in existing_data["clients"] if c.get("email") != client_email]
        deleted_count = original_count - len(existing_data["clients"])

        if deleted_count == 0:
            return jsonify({
                'error': 'Not found',
                'message': f'Client with email {client_email} not found'
            }), 404

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["people_data"]
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

        print(f"🎉 Successfully deleted client from SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully deleted client',
            'filename': output_filename
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to delete client',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 14: DELETE CONFIRMING PARTY
# ======================================
@app.route('/api/delete-confirming-party', methods=['POST'])
def delete_confirming_party():
    try:
        data = request.json
        confirming_party_email = data.get('email')

        if not confirming_party_email:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'email is required'
            }), 400

        print(f"🚀 Deleting confirming party with email: {confirming_party_email}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing people_data.json
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "people_data.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        existing_data = {
            "auditors": [],
            "clients": [],
            "confirming_parties": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file: {str(e)}")
            return jsonify({
                'error': 'File not found',
                'message': 'people_data.json not found on SharePoint'
            }), 404

        # Remove confirming party by email
        if "confirming_parties" not in existing_data:
            existing_data["confirming_parties"] = []

        original_count = len(existing_data["confirming_parties"])
        existing_data["confirming_parties"] = [
            cp for cp in existing_data["confirming_parties"] 
            if cp.get("email") != confirming_party_email
        ]
        deleted_count = original_count - len(existing_data["confirming_parties"])

        if deleted_count == 0:
            return jsonify({
                'error': 'Not found',
                'message': f'Confirming party with email {confirming_party_email} not found'
            }), 404

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["people_data"]
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

        print(f"🎉 Successfully deleted confirming party from SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully deleted confirming party',
            'filename': output_filename
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to delete confirming party',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 15: CREATE AUTHORIZATION LETTERS
# ======================================
@app.route('/api/create-authorization-letters', methods=['POST'])
def create_authorization_letters():
    try:
        data = request.json
        letters = data.get('letters', [])

        if not letters or len(letters) == 0:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'letters array is required'
            }), 400

        print(f"🚀 Creating {len(letters)} authorization letters")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing authorization_letters.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "authorization_letters.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {
            "letters": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # File exists, download and load it
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure letters list exists
        if "letters" not in existing_data:
            existing_data["letters"] = []

        # Append new letters
        existing_data["letters"].extend(letters)

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["authorization_letters"]
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

        print(f"🎉 Successfully created authorization letters on SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully created {len(letters)} authorization letter(s)',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to create authorization letters',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 16: RUN DOMAIN TEST
# ======================================
@app.route('/api/run-domain-test', methods=['POST'])
def run_domain_test():
    try:
        data = request.json
        domain = data.get('domain')
        organization = data.get('organization')
        recipient_name = data.get('recipient_name')
        area = data.get('area')
        email = data.get('email')

        if not domain or not email:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'domain and email are required'
            }), 400

        print(f"🚀 Running domain test for: {domain}")

        # General domains list
        general_domains = ['google.com', 'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com', 'protonmail.com']

        # If organization is not provided, try to get it from authorization requests
        # For now, we'll use the provided organization or empty string
        final_organization = organization or ""

        # Get domain info using whois
        domain_info = {}
        test_status = "passed"
        
        if domain.lower() in general_domains:
            domain_info = {
                "domain": domain,
                "status": "General Domain",
                "creation_date": "",
                "expiry_date": "",
                "registrar": ""
            }
            test_status = "general-domain"
        else:
            try:
                w = whois.whois(domain)
                creation_date = ""
                expiry_date = ""
                
                # Normalize creation date
                if isinstance(w.creation_date, list):
                    creation_date = w.creation_date[0].strftime("%Y-%m-%d")
                elif w.creation_date:
                    creation_date = w.creation_date.strftime("%Y-%m-%d")
                
                # Normalize expiry date
                if isinstance(w.expiration_date, list):
                    expiry_date = w.expiration_date[0].strftime("%Y-%m-%d")
                elif w.expiration_date:
                    expiry_date = w.expiration_date.strftime("%Y-%m-%d")
                
                domain_info = {
                    "domain": domain,
                    "status": "Active" if w.domain_name else "Inactive/Not Found",
                    "creation_date": creation_date,
                    "expiry_date": expiry_date,
                    "registrar": w.registrar if w.registrar else ""
                }
                
                # If domain exists and is active, status is "passed"
                if w.domain_name:
                    test_status = "passed"
                else:
                    test_status = "failed"
            except Exception as e:
                print(f"⚠️ Error fetching whois data: {str(e)}")
                domain_info = {
                    "domain": domain,
                    "status": "Not Found",
                    "creation_date": "",
                    "expiry_date": "",
                    "registrar": ""
                }
                test_status = "failed"

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing domain_info.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "domain_info.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {
            "domain_records": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure domain_records list exists
        if "domain_records" not in existing_data:
            existing_data["domain_records"] = []

        # Try to get organization from authorization requests if not provided
        # Download authorization_letters.json to find matching organization
        final_organization = organization or ""
        if not final_organization:
            try:
                auth_letters_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/authorization_letters.json:/content"
                auth_resp = requests.get(auth_letters_url, headers=headers)
                if auth_resp.status_code == 200:
                    auth_data = auth_resp.json()
                    # Find matching letter by recipient email
                    if "letters" in auth_data:
                        for letter in auth_data["letters"]:
                            if letter.get("recipientEmail") == email and letter.get("status") == "authorized":
                                final_organization = letter.get("confirmingParty", "")
                                break
            except:
                pass  # If we can't get it, use empty string

        # Create new record
        new_record = {
            "domain_info": domain_info,
            "confirming_party_info": {
                "organization": final_organization,
                "recipient_name": recipient_name or "",
                "area": area or "",
                "email_address": email
            }
        }

        # Check if a record already exists for this email and update it, otherwise append
        existing_index = -1
        for i, record in enumerate(existing_data["domain_records"]):
            if record.get("confirming_party_info", {}).get("email_address") == email:
                existing_index = i
                break
        
        if existing_index >= 0:
            # Update existing record
            existing_data["domain_records"][existing_index] = new_record
            print(f"✅ Updated existing domain test record for {email}")
        else:
            # Append new record
            existing_data["domain_records"].append(new_record)
            print(f"✅ Added new domain test record for {email}")

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["domain_info"]
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

        # Find ALL authorization letter IDs by matching recipient email and add Stage 4 activity log for each
        letter_ids = []
        try:
            auth_letters_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/authorization_letters.json:/content"
            auth_resp = requests.get(auth_letters_url, headers=headers)
            if auth_resp.status_code == 200:
                # Handle binary download
                auth_temp_path = os.path.join(script_dir, "temp_auth_letters.json")
                with open(auth_temp_path, "wb") as f:
                    f.write(auth_resp.content)
                with open(auth_temp_path, "r", encoding="utf-8") as f:
                    auth_data = json.load(f)
                # Find ALL matching letters by recipient email
                if "letters" in auth_data:
                    for letter in auth_data["letters"]:
                        if letter.get("recipientEmail") == email:
                            letter_id = letter.get("id")
                            if letter_id:
                                letter_ids.append(letter_id)
                # Clean up temp file
                if os.path.exists(auth_temp_path):
                    os.remove(auth_temp_path)
        except Exception as e:
            print(f"⚠️ Could not find authorization letters: {str(e)}")

        # Add Stage 4 activity log entry for ALL matching letter IDs
        if letter_ids:
            try:
                # Prepare activity log details based on test status
                details = f"Domain {domain} verified successfully"
                if test_status == "general-domain":
                    details = f"Domain {domain} is a general domain (gmail.com, yahoo.com, etc.)"
                elif test_status == "failed":
                    details = f"Domain {domain} verification failed"

                # Get IP address
                try:
                    ip_address = requests.get("https://api.ipify.org").text
                except:
                    ip_address = "Unavailable"

                # Download existing activity_log.json
                activity_log_filename = "activity_log.json"
                activity_log_temp_path = os.path.join(script_dir, activity_log_filename)
                activity_log_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{activity_log_filename}"
                activity_log_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{activity_log_file_path}:/content"
                
                activity_log_data = {"timeline": []}
                try:
                    activity_log_resp = requests.get(activity_log_download_url, headers=headers)
                    if activity_log_resp.status_code == 200:
                        # Handle binary download
                        with open(activity_log_temp_path, "wb") as f:
                            f.write(activity_log_resp.content)
                        with open(activity_log_temp_path, "r", encoding="utf-8") as f:
                            activity_log_data = json.load(f)
                except:
                    pass  # Create new if doesn't exist

                # Ensure timeline exists
                if "timeline" not in activity_log_data:
                    activity_log_data["timeline"] = []

                # Add new entry for EACH matching letter_id
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                for letter_id in letter_ids:
                    new_entry = {
                        "timestamp": timestamp,
                        "stage": "Domain Testing",
                        "action": "Email domain verified",
                        "performed_by": "System",
                        "details": details,
                        "status": "completed" if test_status != "failed" else "pending",
                        "ip_address": ip_address,
                        "letter_id": letter_id
                    }
                    activity_log_data["timeline"].append(new_entry)
                
                print(f"✅ Added Stage 4 activity log entries for {len(letter_ids)} letter(s)")

                # Save and upload activity log
                with open(activity_log_temp_path, "w", encoding="utf-8") as f:
                    json.dump(activity_log_data, f, indent=4)

                activity_log_section_list = ["activity_log"]
                jugg(
                    file_path=activity_log_temp_path,
                    reference_value="",
                    folder_name=folder_name,
                    sub_folder_name=sub_folder_name,
                    fy_year=fy_year,
                    section_list=activity_log_section_list,
                    headers=headers,
                    site_id=site_id,
                    drive_id=drive_id
                )

                # Clean up temp file
                if os.path.exists(activity_log_temp_path):
                    os.remove(activity_log_temp_path)

                print(f"✅ Added Stage 4 activity log entries for {len(letter_ids)} letter(s)")
            except Exception as e:
                print(f"⚠️ Error adding activity log: {str(e)}")
                import traceback
                traceback.print_exc()

        print(f"🎉 Successfully saved domain test result to SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully ran domain test for {domain}',
            'filename': output_filename,
            'fileUrl': file_web_url,
            'domainInfo': domain_info,
            'testStatus': test_status
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to run domain test',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 17: GET AUTHORIZATION LETTERS
# ======================================
@app.route('/api/get-authorization-letters', methods=['GET'])
def get_authorization_letters():
    try:
        file_name = "authorization_letters.json"
        print(f"🚀 Downloading {file_name} from SharePoint")

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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Read the JSON content
            letters_data = download_resp.json()
            
            print(f"✅ Successfully downloaded {file_name}")
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded {file_name}',
                'data': letters_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return empty structure
                print(f"ℹ️ File {file_name} does not exist on SharePoint, returning empty structure")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist, returning empty structure',
                    'data': {
                        'letters': []
                    },
                    'filename': file_name
                })
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get authorization letters',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 18: GET DOMAIN INFO
# ======================================
@app.route('/api/get-domain-info', methods=['GET'])
def get_domain_info():
    try:
        file_name = "domain_info.json"
        print(f"🚀 Downloading {file_name} from SharePoint")

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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Read the JSON content
            domain_data = download_resp.json()
            
            print(f"✅ Successfully downloaded {file_name}")
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded {file_name}',
                'data': domain_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return empty structure
                print(f"ℹ️ File {file_name} does not exist on SharePoint, returning empty structure")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist, returning empty structure',
                    'data': {
                        'domain_records': []
                    },
                    'filename': file_name
                })
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get domain info',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 19: ADD ACTIVITY LOG ENTRY
# ======================================
@app.route('/api/add-activity-log', methods=['POST'])
def add_activity_log():
    try:
        data = request.json
        letter_id = data.get('letterId')
        stage = data.get('stage')
        action = data.get('action')
        performed_by = data.get('performedBy', '')
        details = data.get('details', '')
        status = data.get('status', 'completed')
        
        if not letter_id or not stage or not action:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'letterId, stage, and action are required'
            }), 400

        print(f"🚀 Adding activity log entry for letter {letter_id}, stage: {stage}")

        # Get IP address
        try:
            ip_response = requests.get("https://api.ipify.org", timeout=5)
            ip_address = ip_response.text if ip_response.status_code == 200 else "Unavailable"
        except:
            ip_address = "Unavailable"

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing activity_log.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "activity_log.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {
            "timeline": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_data = download_resp.json()
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure timeline list exists
        if "timeline" not in existing_data:
            existing_data["timeline"] = []

        # Create new activity log entry
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        new_entry = {
            "letter_id": letter_id,
            "timestamp": timestamp,
            "stage": stage,
            "action": action,
            "performed_by": performed_by,
            "details": details,
            "status": status,
            "ip_address": ip_address
        }

        # Append new entry
        existing_data["timeline"].append(new_entry)

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["activity_log"]
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

        print(f"🎉 Successfully added activity log entry to SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully added activity log entry',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to add activity log entry',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 20: GET ACTIVITY LOG
# ======================================
@app.route('/api/get-activity-log', methods=['GET'])
def get_activity_log():
    try:
        letter_id = request.args.get('letterId')
        file_name = "activity_log.json"
        print(f"🚀 Downloading {file_name} from SharePoint")

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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Handle binary download
            script_dir = os.path.dirname(os.path.abspath(__file__))
            temp_file_path = os.path.join(script_dir, "temp_activity_log.json")
            with open(temp_file_path, "wb") as f:
                f.write(download_resp.content)
            with open(temp_file_path, "r", encoding="utf-8") as f:
                activity_data = json.load(f)
            
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            
            print(f"✅ Successfully downloaded {file_name}")
            
            # Filter by letter_id if provided
            if letter_id and "timeline" in activity_data:
                activity_data["timeline"] = [
                    entry for entry in activity_data["timeline"]
                    if entry.get("letter_id") == letter_id
                ]
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded {file_name}',
                'data': activity_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return empty structure
                print(f"ℹ️ File {file_name} does not exist on SharePoint, returning empty structure")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist, returning empty structure',
                    'data': {
                        'timeline': []
                    },
                    'filename': file_name
                })
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get activity log',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 21: CREATE AUTHORIZATION REQUEST
# ======================================
@app.route('/api/create-authorization-request', methods=['POST'])
def create_authorization_request():
    try:
        data = request.json
        request_data = data.get('request')

        if not request_data:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'request data is required'
            }), 400

        print(f"🚀 Creating authorization request: {request_data.get('id', 'Unknown')}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing authorization_requests.json if it exists
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "authorization_requests.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data or create new structure
        existing_data = {
            "requests": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # File exists, download and load it
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file (creating new): {str(e)}")

        # Ensure requests list exists
        if "requests" not in existing_data:
            existing_data["requests"] = []

        # Check if request with same ID already exists (for resend scenario)
        request_id = request_data.get("id")
        updated = False
        for i, req in enumerate(existing_data["requests"]):
            if req.get("id") == request_id:
                # Update existing request
                existing_data["requests"][i] = request_data
                updated = True
                print(f"♻️ Updated existing authorization request: {request_id}")
                break

        # Append new request if it doesn't exist
        if not updated:
            existing_data["requests"].append(request_data)
            print(f"➕ Added new authorization request: {request_id}")

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["authorization_requests"]
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

        print(f"🎉 Successfully created authorization request on SharePoint")
        return jsonify({
            'success': True,
            'message': 'Successfully created authorization request',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to create authorization request',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 22: UPDATE AUTHORIZATION LETTER STATUS
# ======================================
@app.route('/api/update-authorization-letter-status', methods=['POST'])
def update_authorization_letter_status():
    try:
        data = request.json
        letter_id = data.get('letterId')
        status = data.get('status')
        authorized_by = data.get('authorizedBy')
        authorized_date = data.get('authorizedDate')
        authorized_ip = data.get('authorizedIP')

        if not letter_id or not status:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'letterId and status are required'
            }), 400

        print(f"🚀 Updating authorization letter {letter_id} status to {status}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing authorization_letters.json
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "authorization_letters.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data
        existing_data = {
            "letters": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # File exists, download and load it
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file: {str(e)}")
            return jsonify({
                'error': 'File not found',
                'message': 'authorization_letters.json not found'
            }), 404

        # Ensure letters list exists
        if "letters" not in existing_data:
            existing_data["letters"] = []

        # Update the letter status
        updated = False
        for letter in existing_data["letters"]:
            if letter.get("id") == letter_id:
                letter["status"] = status
                if authorized_by:
                    letter["authorizedBy"] = authorized_by
                if authorized_date:
                    letter["authorizedDate"] = authorized_date
                if authorized_ip:
                    letter["authorizedIP"] = authorized_ip
                updated = True
                break

        if not updated:
            return jsonify({
                'error': 'Letter not found',
                'message': f'Authorization letter with id {letter_id} not found'
            }), 404

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["authorization_letters"]
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

        print(f"🎉 Successfully updated authorization letter status on SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully updated authorization letter status to {status}',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to update authorization letter status',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 23: GET AUTHORIZATION REQUESTS
# ======================================
@app.route('/api/get-authorization-requests', methods=['GET'])
def get_authorization_requests():
    try:
        file_name = "authorization_requests.json"
        print(f"🚀 Downloading {file_name} from SharePoint")

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
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Download as binary and parse JSON
            script_dir = os.path.dirname(os.path.abspath(__file__))
            temp_file_path = os.path.join(script_dir, file_name)
            
            with open(temp_file_path, "wb") as f:
                f.write(download_resp.content)
            
            with open(temp_file_path, "r", encoding="utf-8") as f:
                requests_data = json.load(f)
            
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            
            print(f"✅ Successfully downloaded {file_name}")
            
            return jsonify({
                'success': True,
                'message': f'Successfully downloaded {file_name}',
                'data': requests_data,
                'filename': file_name
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return empty structure
                print(f"ℹ️ File {file_name} does not exist on SharePoint, returning empty structure")
                return jsonify({
                    'success': True,
                    'message': f'File {file_name} does not exist, returning empty structure',
                    'data': {
                        'requests': []
                    },
                    'filename': file_name
                })
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get authorization requests',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 24: UPDATE AUTHORIZATION REQUEST STATUS
# ======================================
@app.route('/api/update-authorization-request-status', methods=['POST'])
def update_authorization_request_status():
    try:
        data = request.json
        request_id = data.get('requestId')
        status = data.get('status')
        authorized_by = data.get('authorizedBy', '')
        authorized_date = data.get('authorizedDate', '')

        if not request_id or not status:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'requestId and status are required'
            }), 400

        print(f"🚀 Updating authorization request {request_id} status to {status}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download existing authorization_requests.json
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "authorization_requests.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data
        existing_data = {
            "requests": []
        }
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # File exists, download and load it
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                
                print(f"✅ Loaded existing {output_filename}")
        except Exception as e:
            print(f"ℹ️ Could not download existing file: {str(e)}")
            return jsonify({
                'error': 'File not found',
                'message': 'authorization_requests.json not found'
            }), 404

        # Ensure requests list exists
        if "requests" not in existing_data:
            existing_data["requests"] = []

        # Update the request status
        updated = False
        for req in existing_data["requests"]:
            if req.get("id") == request_id:
                req["status"] = status
                if authorized_by:
                    req["authorizedBy"] = authorized_by
                if authorized_date:
                    req["authorizedDate"] = authorized_date
                updated = True
                break

        if not updated:
            return jsonify({
                'error': 'Request not found',
                'message': f'Authorization request with id {request_id} not found'
            }), 404

        # Save updated data to temporary file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=4)

        print(f"✅ Updated {output_filename}")

        # Upload to SharePoint
        section_list = ["authorization_requests"]
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

        print(f"🎉 Successfully updated authorization request status on SharePoint")
        return jsonify({
            'success': True,
            'message': f'Successfully updated authorization request status to {status}',
            'filename': output_filename,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to update authorization request status',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 25: SEND CONFIRMATION TO CONFIRMING PARTY
# ======================================
@app.route('/api/send-confirmation-to-party', methods=['POST'])
def send_confirmation_to_party():
    try:
        data = request.json
        letter_id = data.get('letterId')
        is_resend = data.get('isResend', False)
        remarks = data.get('remarks', '')

        if not letter_id:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'letterId is required'
            }), 400

        print(f"🚀 Sending confirmation to party for letter {letter_id} (resend: {is_resend})")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        script_dir = os.path.dirname(os.path.abspath(__file__))

        # Download authorization_letters.json to get letter details
        auth_letters_filename = "authorization_letters.json"
        auth_letters_temp_path = os.path.join(script_dir, auth_letters_filename)
        auth_letters_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{auth_letters_filename}"
        auth_letters_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{auth_letters_file_path}:/content"
        
        letter_data = None
        try:
            auth_letters_resp = requests.get(auth_letters_download_url, headers=headers)
            if auth_letters_resp.status_code == 200:
                with open(auth_letters_temp_path, "wb") as f:
                    f.write(auth_letters_resp.content)
                with open(auth_letters_temp_path, "r", encoding="utf-8") as f:
                    auth_letters_data = json.load(f)
                
                # Find the letter
                if "letters" in auth_letters_data:
                    for letter in auth_letters_data["letters"]:
                        if letter.get("id") == letter_id:
                            letter_data = letter
                            break
                
                # Clean up temp file
                if os.path.exists(auth_letters_temp_path):
                    os.remove(auth_letters_temp_path)
        except Exception as e:
            print(f"⚠️ Error fetching authorization letter: {str(e)}")
            return jsonify({
                'error': 'Letter not found',
                'message': f'Authorization letter with id {letter_id} not found'
            }), 404

        if not letter_data:
            return jsonify({
                'error': 'Letter not found',
                'message': f'Authorization letter with id {letter_id} not found'
            }), 404

        # Download or create pending_confirmations.json
        pending_conf_filename = "pending_confirmations.json"
        pending_conf_temp_path = os.path.join(script_dir, pending_conf_filename)
        pending_conf_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{pending_conf_filename}"
        pending_conf_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{pending_conf_file_path}:/content"
        
        pending_confirmations_data = {"confirmations": []}
        try:
            pending_conf_resp = requests.get(pending_conf_download_url, headers=headers)
            if pending_conf_resp.status_code == 200:
                with open(pending_conf_temp_path, "wb") as f:
                    f.write(pending_conf_resp.content)
                with open(pending_conf_temp_path, "r", encoding="utf-8") as f:
                    pending_confirmations_data = json.load(f)
        except:
            pass  # Create new if doesn't exist

        # Ensure confirmations list exists
        if "confirmations" not in pending_confirmations_data:
            pending_confirmations_data["confirmations"] = []

        # Create or update pending confirmation
        confirmation_id = f"CNF-{letter_id.replace('AL-', '')}"
        existing_confirmation = None
        for i, conf in enumerate(pending_confirmations_data["confirmations"]):
            if conf.get("id") == confirmation_id:
                existing_confirmation = i
                break

        from datetime import datetime
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Get auditor info from people_data.json (use first auditor if available)
        auditor_name = "Auditor"
        auditor_email = "auditor@testcloud.com"
        try:
            people_data_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/people_data.json:/content"
            people_resp = requests.get(people_data_url, headers=headers)
            if people_resp.status_code == 200:
                people_temp_path = os.path.join(script_dir, "temp_people_data.json")
                with open(people_temp_path, "wb") as f:
                    f.write(people_resp.content)
                with open(people_temp_path, "r", encoding="utf-8") as f:
                    people_data = json.load(f)
                if "auditors" in people_data and len(people_data["auditors"]) > 0:
                    first_auditor = people_data["auditors"][0]
                    auditor_name = first_auditor.get("name", "Auditor")
                    auditor_email = first_auditor.get("email", "auditor@testcloud.com")
                # Clean up temp file
                if os.path.exists(people_temp_path):
                    os.remove(people_temp_path)
        except:
            pass  # Use defaults if can't fetch

        new_confirmation = {
            "id": confirmation_id,
            "letterId": letter_id,
            "confirmationFor": letter_data.get("clientName", "Test Client"),
            "auditFirm": "Test Cloud",
            "auditorName": auditor_name,
            "auditorEmail": auditor_email,
            "area": letter_data.get("area", ""),
            "confirmingParty": letter_data.get("confirmingParty", ""),
            "recipientEmail": letter_data.get("recipientEmail", ""),
            "recipientName": letter_data.get("recipientName", ""),
            "recipientOrg": letter_data.get("recipientOrg", letter_data.get("confirmingParty", "")),
            "amount": letter_data.get("amount", ""),
            "status": "pending",
            "periodEndDate": letter_data.get("periodEndDate", ""),
            "createdAt": now,
            "sentAt": now,
            "remarks": remarks
        }

        if existing_confirmation is not None:
            # Update existing confirmation - ensure audit firm and auditor info are updated
            pending_confirmations_data["confirmations"][existing_confirmation] = new_confirmation
        else:
            # Add new confirmation
            pending_confirmations_data["confirmations"].append(new_confirmation)
        
        # Also update all existing confirmations to use correct audit firm and auditor info
        # This ensures old data is corrected
        for conf in pending_confirmations_data["confirmations"]:
            if conf.get("auditFirm") == "Juggernaut Enterprises" or conf.get("auditFirm") == "":
                conf["auditFirm"] = "Test Cloud"
            if conf.get("auditorEmail") == "auditor@juggernaut.com" or conf.get("auditorEmail") == "":
                conf["auditorEmail"] = auditor_email
            if conf.get("auditorName") == "Auditor" or conf.get("auditorName") == "":
                conf["auditorName"] = auditor_name
            if conf.get("confirmationFor") == "":
                # Try to get from authorization letter if letterId exists
                if conf.get("letterId"):
                    try:
                        auth_letters_resp = requests.get(auth_letters_download_url, headers=headers)
                        if auth_letters_resp.status_code == 200:
                            auth_temp_path = os.path.join(script_dir, "temp_auth_update.json")
                            with open(auth_temp_path, "wb") as f:
                                f.write(auth_letters_resp.content)
                            with open(auth_temp_path, "r", encoding="utf-8") as f:
                                auth_data = json.load(f)
                            if "letters" in auth_data:
                                for letter in auth_data["letters"]:
                                    if letter.get("id") == conf.get("letterId"):
                                        conf["confirmationFor"] = letter.get("clientName", "Test Client")
                                        break
                            if os.path.exists(auth_temp_path):
                                os.remove(auth_temp_path)
                    except:
                        pass
                if conf.get("confirmationFor") == "":
                    conf["confirmationFor"] = "Test Client"

        # Save pending confirmations
        with open(pending_conf_temp_path, "w", encoding="utf-8") as f:
            json.dump(pending_confirmations_data, f, indent=4)

        # Upload pending confirmations
        section_list = ["pending_confirmations"]
        jugg(
            file_path=pending_conf_temp_path,
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
        if os.path.exists(pending_conf_temp_path):
            os.remove(pending_conf_temp_path)

        # Add Stage 5 activity log entry
        try:
            # Get IP address
            try:
                ip_address = requests.get("https://api.ipify.org").text
            except:
                ip_address = "Unavailable"

            # Download existing activity_log.json
            activity_log_filename = "activity_log.json"
            activity_log_temp_path = os.path.join(script_dir, activity_log_filename)
            activity_log_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{activity_log_filename}"
            activity_log_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{activity_log_file_path}:/content"
            
            activity_log_data = {"timeline": []}
            try:
                activity_log_resp = requests.get(activity_log_download_url, headers=headers)
                if activity_log_resp.status_code == 200:
                    with open(activity_log_temp_path, "wb") as f:
                        f.write(activity_log_resp.content)
                    with open(activity_log_temp_path, "r", encoding="utf-8") as f:
                        activity_log_data = json.load(f)
            except:
                pass  # Create new if doesn't exist

            # Ensure timeline exists
            if "timeline" not in activity_log_data:
                activity_log_data["timeline"] = []

            # Prepare details
            action_text = "Sent to confirming party for confirmation" if not is_resend else "Resent to confirming party for confirmation"
            details = f"Confirmation request sent to {letter_data.get('recipientName', '')} ({letter_data.get('recipientEmail', '')})"
            if remarks:
                details += f". Remarks: {remarks}"

            # Add new entry
            new_entry = {
                "timestamp": now,
                "stage": "Send to Confirming Party",
                "action": action_text,
                "performed_by": auditor_name,  # Get from people_data.json
                "details": details,
                "status": "completed",
                "ip_address": ip_address,
                "letter_id": letter_id
            }
            activity_log_data["timeline"].append(new_entry)

            # Save and upload activity log
            with open(activity_log_temp_path, "w", encoding="utf-8") as f:
                json.dump(activity_log_data, f, indent=4)

            activity_log_section_list = ["activity_log"]
            jugg(
                file_path=activity_log_temp_path,
                reference_value="",
                folder_name=folder_name,
                sub_folder_name=sub_folder_name,
                fy_year=fy_year,
                section_list=activity_log_section_list,
                headers=headers,
                site_id=site_id,
                drive_id=drive_id
            )

            # Clean up temp file
            if os.path.exists(activity_log_temp_path):
                os.remove(activity_log_temp_path)

            print(f"✅ Added Stage 5 activity log entry for letter {letter_id}")
        except Exception as e:
            print(f"⚠️ Error adding activity log: {str(e)}")
            import traceback
            traceback.print_exc()

        print(f"🎉 Successfully sent confirmation to party")
        return jsonify({
            'success': True,
            'message': f'Successfully sent confirmation to confirming party',
            'confirmationId': confirmation_id
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to send confirmation to party',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 26: SUBMIT CONFIRMATION (STAGE 6)
# ======================================
@app.route('/api/submit-confirmation', methods=['POST'])
def submit_confirmation():
    try:
        data = request.json
        confirmation_id = data.get('confirmationId')
        form_data = data.get('formData', {})
        template_details_provided = data.get('templateDetails')  # Complete templateDetails structure from frontend
        remarks = data.get('remarks', '')
        attachments = data.get('attachments', [])
        name = data.get('name', '')
        designation = data.get('designation', '')
        organization_name = data.get('organizationName', '')
        status = data.get('status', 'confirmed')  # 'confirmed' or 'draft'

        if not confirmation_id:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'confirmationId is required'
            }), 400

        print(f"🚀 Submitting confirmation {confirmation_id} with status: {status}")
        print(f"📋 Request data keys: {list(data.keys())}")
        print(f"📋 Form data received: {json.dumps(form_data, indent=2)}")
        print(f"📋 TemplateDetails provided: {template_details_provided is not None}")
        print(f"📋 TemplateDetails type: {type(template_details_provided)}")
        print(f"📋 TemplateDetails value: {template_details_provided}")
        if template_details_provided:
            print(f"📋 TemplateDetails keys: {list(template_details_provided.keys()) if isinstance(template_details_provided, dict) else 'Not a dict'}")
        else:
            print(f"⚠️ WARNING: templateDetails is None or not provided in request!")
        print(f"📋 Remarks: {remarks}")
        print(f"📋 Attachments: {attachments}")
        print(f"📋 Name: {name}, Designation: {designation}, Organization: {organization_name}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        script_dir = os.path.dirname(os.path.abspath(__file__))

        # Download pending_confirmations.json
        pending_conf_filename = "pending_confirmations.json"
        pending_conf_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{pending_conf_filename}"
        pending_conf_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{pending_conf_file_path}:/content"
        
        pending_conf_temp_path = os.path.join(script_dir, pending_conf_filename)
        pending_confirmations_data = {"confirmations": []}
        
        try:
            pending_conf_resp = requests.get(pending_conf_download_url, headers=headers)
            if pending_conf_resp.status_code == 200:
                with open(pending_conf_temp_path, "wb") as f:
                    f.write(pending_conf_resp.content)
                with open(pending_conf_temp_path, "r", encoding="utf-8") as f:
                    pending_confirmations_data = json.load(f)
        except:
            pass  # Create new if doesn't exist

        # Ensure confirmations array exists
        if "confirmations" not in pending_confirmations_data:
            pending_confirmations_data["confirmations"] = []

        # Find and update the confirmation
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        confirmation_found = False
        
        # Get IP address
        try:
            ip_address = requests.get("https://api.ipify.org").text
        except:
            ip_address = "Unavailable"

        for conf in pending_confirmations_data["confirmations"]:
            if conf.get("id") == confirmation_id:
                confirmation_found = True
                # Update confirmation with form data and status
                conf["status"] = status
                # Merge form_data with additional fields (name, designation, etc.) for display
                conf["formData"] = {
                    **form_data,
                    "name": name,
                    "designation": designation,
                    "organizationName": organization_name,
                    "isCertified": status == "submitted"  # Only certified if submitted
                }
                conf["remarks"] = remarks
                conf["attachments"] = attachments
                conf["confirmedBy"] = name
                conf["confirmedDesignation"] = designation
                conf["confirmedOrganization"] = organization_name
                conf["confirmedIP"] = ip_address
                
                if status == "submitted":
                    conf["confirmedAt"] = now
                    conf["submittedAt"] = now
                elif status == "draft":
                    conf["draftSavedAt"] = now
                
                break

        if not confirmation_found:
            return jsonify({
                'error': 'Confirmation not found',
                'message': f'Confirmation with ID {confirmation_id} not found'
            }), 404

        # Save updated pending confirmations
        with open(pending_conf_temp_path, "w", encoding="utf-8") as f:
            json.dump(pending_confirmations_data, f, indent=4)

        # Upload pending confirmations
        section_list = ["pending_confirmations"]
        jugg(
            file_path=pending_conf_temp_path,
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
        if os.path.exists(pending_conf_temp_path):
            os.remove(pending_conf_temp_path)

        # Update templateDetails in confirmation_{area_code}.json
        try:
            print(f"🔄 Starting templateDetails update for confirmation {confirmation_id}")
            
            # Get the confirmation entry to find letterId and area
            confirmation_entry = None
            letter_id = None
            for conf in pending_confirmations_data["confirmations"]:
                if conf.get("id") == confirmation_id:
                    confirmation_entry = conf
                    letter_id = conf.get("letterId", "")
                    break
            
            if not confirmation_entry:
                print(f"  ⚠️ Confirmation entry not found for {confirmation_id}")
            elif not letter_id:
                print(f"  ⚠️ letterId not found in confirmation entry for {confirmation_id}")
            else:
                print(f"  📋 Found letterId: {letter_id}")
                
                # Extract area code from letterId (e.g., "OCA_RA_002" -> "OCA")
                area_code = None
                if letter_id and "_" in letter_id:
                    area_code = letter_id.split("_")[0]
                    print(f"  📍 Extracted area code '{area_code}' from letterId '{letter_id}'")
                
                if not area_code:
                    print(f"  ❌ Could not determine area code from letterId '{letter_id}'")
                else:
                    # Read confirmation file from local filesystem
                    confirmation_filename = f"confirmation_{area_code}.json"
                    confirmation_file_path = os.path.join(script_dir, confirmation_filename)
                    confirmation_file_data = {}
                    
                    try:
                        print(f"  📥 Reading {confirmation_filename} from local file...")
                        print(f"  📂 Looking for file at: {confirmation_file_path}")
                        print(f"  📂 Script directory: {script_dir}")
                        print(f"  📂 File exists check: {os.path.exists(confirmation_file_path)}")
                        
                        # Also check if file exists in current directory
                        if not os.path.exists(confirmation_file_path):
                            # Try alternative paths
                            alt_paths = [
                                os.path.join(os.getcwd(), confirmation_filename),
                                os.path.join(os.path.dirname(script_dir), confirmation_filename),
                                confirmation_filename
                            ]
                            for alt_path in alt_paths:
                                if os.path.exists(alt_path):
                                    print(f"  ✅ Found file at alternative path: {alt_path}")
                                    confirmation_file_path = alt_path
                                    break
                        
                        if os.path.exists(confirmation_file_path):
                            with open(confirmation_file_path, "r", encoding="utf-8") as f:
                                confirmation_file_data = json.load(f)
                            
                            # Convert to dict format if it's a list
                            if isinstance(confirmation_file_data, list):
                                confirmation_file_data = {entry.get("sample_id", f"temp_{i}"): {k: v for k, v in entry.items() if k != "sample_id"} for i, entry in enumerate(confirmation_file_data)}
                            print(f"  ✅ Loaded {confirmation_filename} with {len(confirmation_file_data)} entries from {confirmation_file_path}")
                        else:
                            print(f"  ⚠️ {confirmation_filename} not found locally, trying to download from SharePoint...")
                            # Try to download from SharePoint if local file doesn't exist
                            try:
                                import tempfile
                                confirmation_file_path_sp = f"{fy_year}/{folder_name}/{sub_folder_name}/{confirmation_filename}"
                                confirmation_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{confirmation_file_path_sp}:/content"
                                
                                print(f"  📥 Attempting to download from SharePoint: {confirmation_file_path_sp}")
                                confirmation_resp = requests.get(confirmation_download_url, headers=headers)
                                if confirmation_resp.status_code == 200:
                                    # Use temporary file for download (will be deleted after reading)
                                    with tempfile.NamedTemporaryFile(mode='wb', suffix='.json', delete=False) as temp_file:
                                        temp_file.write(confirmation_resp.content)
                                        temp_file_path = temp_file.name
                                    
                                    try:
                                        # Read the downloaded file
                                        with open(temp_file_path, "r", encoding="utf-8") as f:
                                            confirmation_file_data = json.load(f)
                                        
                                        # Convert to dict format if it's a list
                                        if isinstance(confirmation_file_data, list):
                                            confirmation_file_data = {entry.get("sample_id", f"temp_{i}"): {k: v for k, v in entry.items() if k != "sample_id"} for i, entry in enumerate(confirmation_file_data)}
                                        print(f"  ✅ Downloaded and loaded {confirmation_filename} with {len(confirmation_file_data)} entries from SharePoint")
                                    finally:
                                        # Clean up temporary file
                                        try:
                                            os.unlink(temp_file_path)
                                        except Exception:
                                            pass
                                else:
                                    print(f"  ⚠️ Could not download from SharePoint: HTTP {confirmation_resp.status_code}, creating new file")
                            except Exception as download_err:
                                print(f"  ⚠️ Error downloading from SharePoint: {str(download_err)}, creating new file")
                    except Exception as e:
                        print(f"  ⚠️ Error reading {confirmation_filename}: {str(e)}")
                        import traceback
                        traceback.print_exc()
                    
                    # Use letterId as the key in confirmation file (e.g., "OCA_RA_001")
                    confirmation_file_key = letter_id
                    print(f"  🔑 Using letterId '{confirmation_file_key}' as key in confirmation file")
                    
                    # Get area from partydetails or selectedTemplate
                    confirmation_area = None
                    print(f"  🔍 Checking for entry '{confirmation_file_key}' in confirmation file...")
                    print(f"  📋 Confirmation file has {len(confirmation_file_data)} entries")
                    print(f"  📋 Entry keys in file: {list(confirmation_file_data.keys())}")
                    
                    if confirmation_file_key in confirmation_file_data:
                        print(f"  ✅ Entry '{confirmation_file_key}' found in confirmation file")
                        if "partydetails" in confirmation_file_data[confirmation_file_key]:
                            confirmation_area = confirmation_file_data[confirmation_file_key]["partydetails"].get("area", "")
                            print(f"  📍 Got area '{confirmation_area}' from partydetails")
                        
                        if not confirmation_area:
                            confirmation_area = confirmation_file_data[confirmation_file_key].get("selectedTemplate", "")
                            if confirmation_area:
                                print(f"  📍 Got area '{confirmation_area}' from selectedTemplate")
                    else:
                        print(f"  ⚠️ Entry '{confirmation_file_key}' not found in confirmation file")
                        print(f"  📋 Available entries: {list(confirmation_file_data.keys())}")
                        # Try case-insensitive match
                        for key in confirmation_file_data.keys():
                            if key.upper() == confirmation_file_key.upper():
                                print(f"  🔄 Found case-insensitive match: '{key}' -> using '{key}'")
                                confirmation_file_key = key
                                if "partydetails" in confirmation_file_data[confirmation_file_key]:
                                    confirmation_area = confirmation_file_data[confirmation_file_key]["partydetails"].get("area", "")
                                if not confirmation_area:
                                    confirmation_area = confirmation_file_data[confirmation_file_key].get("selectedTemplate", "")
                                break
                    
                    if not confirmation_area:
                        print(f"  ⚠️ No area found for confirmation {confirmation_id}, cannot load template")
                    else:
                        print(f"  🔍 Loading template for area: '{confirmation_area}'")
                        
                        # Load template from local Confirmation_Template.json or create_template.json
                        # First try Confirmation_Template.json for standard templates, then create_template.json for custom templates
                        template_details = None
                        
                        # First try Confirmation_Template.json for standard templates
                        try:
                            template_file_name = "Confirmation_Template.json"
                            template_file_path = os.path.join(script_dir, template_file_name)
                            
                            print(f"  📥 Attempting to load {template_file_name} from local file...")
                            if os.path.exists(template_file_path):
                                with open(template_file_path, "r", encoding="utf-8") as f:
                                    template_data = json.load(f)
                                print(f"  ✅ Loaded {template_file_name}, checking for area '{confirmation_area}'...")
                                if confirmation_area in template_data and "templateDetails" in template_data[confirmation_area]:
                                    import copy
                                    template_details = copy.deepcopy(template_data[confirmation_area]["templateDetails"])
                                    print(f"  ✅ Loaded templateDetails for area '{confirmation_area}' from Confirmation_Template.json")
                                else:
                                    print(f"  ⚠️ Area '{confirmation_area}' not found in {template_file_name} or missing templateDetails")
                            else:
                                print(f"  ⚠️ {template_file_name} not found at {template_file_path}")
                        except Exception as e:
                            print(f"  ⚠️ Error loading Confirmation_Template.json: {str(e)}")
                        
                        # If not found in standard templates, try create_template.json for custom templates
                        if not template_details:
                            try:
                                template_file_name = "create_template.json"
                                template_file_path = os.path.join(script_dir, template_file_name)
                                
                                print(f"  📥 Attempting to load {template_file_name} from local file...")
                                if os.path.exists(template_file_path):
                                    with open(template_file_path, "r", encoding="utf-8") as f:
                                        template_data = json.load(f)
                                    print(f"  ✅ Loaded {template_file_name}, checking for area '{confirmation_area}'...")
                                    if confirmation_area in template_data and "templateDetails" in template_data[confirmation_area]:
                                        import copy
                                        template_details = copy.deepcopy(template_data[confirmation_area]["templateDetails"])
                                        print(f"  ✅ Loaded templateDetails for custom template '{confirmation_area}' from create_template.json")
                                    else:
                                        print(f"  ⚠️ Area '{confirmation_area}' not found in {template_file_name} or missing templateDetails")
                                else:
                                    print(f"  ⚠️ {template_file_name} not found at {template_file_path}")
                            except Exception as e:
                                print(f"  ⚠️ Error loading create_template.json: {str(e)}")
                        
                        # If template not found, use existing templateDetails or create empty
                        if not template_details:
                            if confirmation_file_key in confirmation_file_data:
                                existing_template_details = confirmation_file_data[confirmation_file_key].get("templateDetails", {})
                                if existing_template_details and existing_template_details != {}:
                                    import copy
                                    template_details = copy.deepcopy(existing_template_details)
                                    print(f"  ℹ️ Using existing templateDetails for {confirmation_file_key}")
                                else:
                                    template_details = {}
                                    print(f"  ⚠️ Template '{confirmation_area}' not found, using empty templateDetails")
                        
                        # Ensure confirmation entry exists in confirmation file (using letterId as key)
                        if confirmation_file_key not in confirmation_file_data:
                            print(f"  ⚠️ Entry '{confirmation_file_key}' not found in confirmation file, creating new entry")
                            # Create new entry with basic structure
                            confirmation_file_data[confirmation_file_key] = {
                                "partydetails": {},
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
                        else:
                            print(f"  ✅ Entry '{confirmation_file_key}' found in confirmation file")
                            # Log existing entry structure for debugging
                            existing_keys = list(confirmation_file_data[confirmation_file_key].keys())
                            print(f"  📋 Existing entry has keys: {existing_keys}")
                            if "templateDetails" in confirmation_file_data[confirmation_file_key]:
                                existing_template_keys = list(confirmation_file_data[confirmation_file_key]["templateDetails"].keys()) if isinstance(confirmation_file_data[confirmation_file_key]["templateDetails"], dict) else "not a dict"
                                print(f"  📋 Existing templateDetails has keys: {existing_template_keys}")
                        
                        # Initialize templateDetails if it doesn't exist
                        if "templateDetails" not in confirmation_file_data[confirmation_file_key]:
                            confirmation_file_data[confirmation_file_key]["templateDetails"] = {}
                            print(f"  ✅ Initialized empty templateDetails for entry '{confirmation_file_key}'")
                        
                        # Use templateDetails if provided (from CustomTemplateForm), otherwise extract from form_data
                        if template_details_provided and isinstance(template_details_provided, dict):
                            print(f"  ✅ Using provided templateDetails structure (from CustomTemplateForm)")
                            print(f"  📋 TemplateDetails keys: {list(template_details_provided.keys())}")
                            
                            # Log table keys specifically
                            table_keys = [k for k in template_details_provided.keys() if k.startswith('table_')]
                            textbox_keys = [k for k in template_details_provided.keys() if k.startswith('textbox_')]
                            print(f"  📊 Table keys in templateDetails: {table_keys}")
                            print(f"  📝 Textbox keys in templateDetails: {textbox_keys}")
                            
                            # Log each table structure
                            for table_key in table_keys:
                                table_data = template_details_provided.get(table_key, {})
                                print(f"  📋 {table_key}: columns={table_data.get('columns', [])}, rows_count={len(table_data.get('rows', []))}, addRow={table_data.get('addRow', False)}")
                            
                            # Use the provided templateDetails directly, but update with user-specific data
                            import copy
                            final_template_details = copy.deepcopy(template_details_provided)
                            
                            # Update remarks and attachments if provided separately
                            if remarks:
                                final_template_details["remarks"] = remarks
                            if attachments:
                                final_template_details["attachments"] = attachments
                            
                            # Update confirming party details
                            if "confirmingpartydetails" in final_template_details:
                                final_template_details["confirmingpartydetails"]["name"] = name or ""
                                final_template_details["confirmingpartydetails"]["designation"] = designation or ""
                                final_template_details["confirmingpartydetails"]["organizationName"] = organization_name or ""
                            else:
                                final_template_details["confirmingpartydetails"] = {
                                    "name": name or "",
                                    "designation": designation or "",
                                    "organizationName": organization_name or ""
                                }
                            
                            # Update confirming party statement
                            if "confirmingpartystatement" in final_template_details:
                                if isinstance(final_template_details["confirmingpartystatement"], list):
                                    if len(final_template_details["confirmingpartystatement"]) > 0:
                                        final_template_details["confirmingpartystatement"][0]["response"] = "Yes" if status == "submitted" else ""
                                elif isinstance(final_template_details["confirmingpartystatement"], dict):
                                    final_template_details["confirmingpartystatement"]["response"] = "Yes" if status == "submitted" else ""
                            
                            # Verify tables are still present after updates
                            final_table_keys = [k for k in final_template_details.keys() if k.startswith('table_')]
                            print(f"  💾 Saving full templateDetails structure with {len(final_template_details)} keys")
                            print(f"  📊 Final table keys after updates: {final_table_keys}")
                            for table_key in final_table_keys:
                                table_data = final_template_details.get(table_key, {})
                                print(f"  📋 Final {table_key}: columns={table_data.get('columns', [])}, rows_count={len(table_data.get('rows', []))}")
                        else:
                            # Fallback: Extract ONLY user inputs from form_data (for backward compatibility)
                            print(f"  ✅ Extracting ONLY user inputs from form_data (no templateDetails provided)...")
                            print(f"  📋 Form data keys: {list(form_data.keys())}")
                            
                            # Build templateDetails from ONLY user inputs - NO TEMPLATE STRUCTURE
                            final_template_details = {}
                            
                            # Extract textbox inputs
                            if "textboxData" in form_data and form_data["textboxData"]:
                                for key, value in form_data["textboxData"].items():
                                    if value and str(value).strip() != "":
                                        final_template_details[key] = value
                            
                            # Extract table inputs - ONLY rows with actual data
                            if "tableData" in form_data and form_data["tableData"]:
                                for table_key, table_rows in form_data["tableData"].items():
                                    if table_rows and len(table_rows) > 0:
                                        cleaned_rows = []
                                        for row in table_rows:
                                            cleaned_row = {}
                                            has_data = False
                                            for col, val in row.items():
                                                # Skip type spec keys and empty values
                                                if not col.endswith("_type") and val and str(val).strip() != "":
                                                    cleaned_row[col] = val
                                                    has_data = True
                                            if has_data:
                                                cleaned_rows.append(cleaned_row)
                                        if cleaned_rows:
                                            final_template_details[table_key] = {"rows": cleaned_rows}
                            
                            # Extract question responses
                            if "questionResponses" in form_data and form_data["questionResponses"]:
                                for key, value in form_data["questionResponses"].items():
                                    if value and str(value).strip() != "":
                                        final_template_details[key] = {"response": value}
                            
                            # Add remarks and attachments
                            if remarks:
                                final_template_details["remarks"] = remarks
                            if attachments:
                                final_template_details["attachments"] = attachments
                            
                            # Add confirming party details
                            final_template_details["confirmingpartydetails"] = {
                                "name": name or "",
                                "designation": designation or "",
                                "organizationName": organization_name or ""
                            }
                            
                            # Add confirming party statement
                            if status == "submitted":
                                final_template_details["confirmingpartystatement"] = [{"response": "Yes"}]
                            else:
                                final_template_details["confirmingpartystatement"] = [{"response": ""}]
                            
                            print(f"  ✅ Extracted ONLY user inputs: {list(final_template_details.keys())}")
                            print(f"  💾 Saving ONLY user inputs - NO template structure")
                        
                        # Save the final templateDetails to confirmation file
                        if final_template_details is not None:
                            confirmation_file_data[confirmation_file_key]["templateDetails"] = final_template_details
                            print(f"  💾 Saved templateDetails to confirmation file")
                            print(f"  📊 Final templateDetails has {len(final_template_details)} keys")
                            print(f"  📋 Final templateDetails keys: {list(final_template_details.keys())}")
                            # Debug: Log table keys specifically
                            table_keys = [k for k in final_template_details.keys() if k.startswith('table_')]
                            textbox_keys = [k for k in final_template_details.keys() if k.startswith('textbox_')]
                            print(f"  📊 Table keys found: {table_keys}")
                            print(f"  📊 Textbox keys found: {textbox_keys}")
                        else:
                            # Even if template_details is empty, save ALL form data
                            print(f"  ⚠️ No template found, but saving ALL form data to templateDetails...")
                            all_form_data = {}
                            
                            # Save table data in various formats
                            if "tableRows" in form_data and isinstance(form_data["tableRows"], list):
                                all_form_data["table_1"] = {
                                    "columns": list(form_data["tableRows"][0].keys()) if form_data["tableRows"] and len(form_data["tableRows"]) > 0 else [],
                                    "rows": form_data["tableRows"]
                                }
                            elif "amounts" in form_data and isinstance(form_data["amounts"], list):
                                all_form_data["table_1"] = {
                                    "columns": ["Amount", "Currency"],
                                    "rows": [{"Amount": entry.get("amount", ""), "Currency": entry.get("currency", "")} for entry in form_data["amounts"]]
                                }
                            elif "accounts" in form_data and isinstance(form_data["accounts"], list):
                                all_form_data["table_1"] = {
                                    "columns": ["Account", "Amount", "Currency"],
                                    "rows": [{"Account": entry.get("account", ""), "Amount": entry.get("amount", ""), "Currency": entry.get("currency", "")} for entry in form_data["accounts"]]
                                }
                            
                            # Save ALL other form data (yes/no, strings, numbers, etc.)
                            for key, value in form_data.items():
                                if key not in ["amounts", "accounts", "tables", "tableRows", "remarks", "attachments", "isCertified", "status", "submittedAt"]:
                                    if not (isinstance(value, list) and len(value) > 0 and isinstance(value[0], dict)):
                                        all_form_data[key] = value
                            
                            # Merge with existing templateDetails
                            existing = confirmation_file_data[confirmation_file_key].get("templateDetails", {})
                            existing.update(all_form_data)
                            confirmation_file_data[confirmation_file_key]["templateDetails"] = existing
                            print(f"  💾 Saved ALL form data to templateDetails: {list(all_form_data.keys())}")
                        
                        # Save confirmation metadata (confirmedBy, submittedAt, etc.) to the confirmation file
                        if name:
                            confirmation_file_data[confirmation_file_key]["confirmedBy"] = name
                        if designation:
                            confirmation_file_data[confirmation_file_key]["confirmedDesignation"] = designation
                        if organization_name:
                            confirmation_file_data[confirmation_file_key]["confirmedOrganization"] = organization_name
                        confirmation_file_data[confirmation_file_key]["confirmedIP"] = ip_address
                        
                        if status == "submitted":
                            confirmation_file_data[confirmation_file_key]["confirmedAt"] = now
                            confirmation_file_data[confirmation_file_key]["submittedAt"] = now
                        elif status == "draft":
                            confirmation_file_data[confirmation_file_key]["draftSavedAt"] = now
                        
                        confirmation_file_data[confirmation_file_key]["status"] = status
                        
                        # Upload updated confirmation file back to SharePoint (using temporary file)
                        try:
                            import tempfile
                            confirmation_file_path_sp = f"{fy_year}/{folder_name}/{sub_folder_name}/{confirmation_filename}"
                            print(f"  📤 Uploading updated {confirmation_filename} back to SharePoint...")
                            
                            # Create a temporary directory and file with the correct name
                            temp_dir = tempfile.mkdtemp()
                            temp_file_path = os.path.join(temp_dir, confirmation_filename)
                            
                            try:
                                # Write JSON data to temporary file with correct name
                                with open(temp_file_path, "w", encoding="utf-8") as temp_file:
                                    json.dump(confirmation_file_data, temp_file, indent=4)
                                
                                section_list = [f"confirmation_{area_code}"]
                                confirmation_file_web_url = jugg(
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
                                print(f"  ✅ Successfully uploaded {confirmation_filename} to SharePoint")
                            finally:
                                # Clean up temporary directory and file
                                try:
                                    if os.path.exists(temp_file_path):
                                        os.unlink(temp_file_path)
                                    if os.path.exists(temp_dir):
                                        os.rmdir(temp_dir)
                                    print(f"  🗑️ Deleted temporary file: {temp_file_path}")
                                except Exception as cleanup_err:
                                    print(f"  ⚠️ Could not delete temporary file: {str(cleanup_err)}")
                        except Exception as upload_err:
                            print(f"  ⚠️ Error uploading to SharePoint: {str(upload_err)}")
                            import traceback
                            traceback.print_exc()
                        
                        print(f"✅ Updated templateDetails and confirmation metadata in {confirmation_filename} for confirmation {confirmation_id} (saved as {confirmation_file_key})")
        except Exception as e:
            print(f"⚠️ Error updating templateDetails in confirmation file: {str(e)}")
            import traceback
            traceback.print_exc()

        # Add Stage 6 activity log entry (only for submitted status)
        if status == "submitted":
            try:
                # Download existing activity_log.json
                activity_log_filename = "activity_log.json"
                activity_log_temp_path = os.path.join(script_dir, activity_log_filename)
                activity_log_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{activity_log_filename}"
                activity_log_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{activity_log_file_path}:/content"
                
                activity_log_data = {"timeline": []}
                try:
                    activity_log_resp = requests.get(activity_log_download_url, headers=headers)
                    if activity_log_resp.status_code == 200:
                        with open(activity_log_temp_path, "wb") as f:
                            f.write(activity_log_resp.content)
                        with open(activity_log_temp_path, "r", encoding="utf-8") as f:
                            activity_log_data = json.load(f)
                except:
                    pass  # Create new if doesn't exist

                # Ensure timeline exists
                if "timeline" not in activity_log_data:
                    activity_log_data["timeline"] = []

                # Find the confirmation to get letter_id
                letter_id = None
                for conf in pending_confirmations_data["confirmations"]:
                    if conf.get("id") == confirmation_id:
                        letter_id = conf.get("letterId")
                        break

                # Create Stage 6 activity log entry
                performed_by = f"{name} ({designation})" if name and designation else name or "Confirming Party"
                details = f"Confirming party submitted response by {performed_by}"
                if organization_name:
                    details += f" from {organization_name}"
                if attachments and len(attachments) > 0:
                    details += f" with {len(attachments)} attachment(s)"
                if ip_address and ip_address != "Unavailable":
                    details += f". IP: {ip_address}"

                new_log_entry = {
                    "letter_id": letter_id or confirmation_id,
                    "timestamp": now,
                    "stage": "Confirmation Receipt",
                    "action": "Confirmation received",
                    "performed_by": performed_by,
                    "details": details,
                    "status": "completed",
                    "ip_address": ip_address
                }

                activity_log_data["timeline"].append(new_log_entry)

                # Save activity log
                with open(activity_log_temp_path, "w", encoding="utf-8") as f:
                    json.dump(activity_log_data, f, indent=4)

                # Upload activity log
                section_list = ["activity_log"]
                jugg(
                    file_path=activity_log_temp_path,
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
                if os.path.exists(activity_log_temp_path):
                    os.remove(activity_log_temp_path)

                print(f"✅ Added Stage 6 activity log entry for confirmation {confirmation_id}")
            except Exception as e:
                print(f"⚠️ Error adding activity log: {str(e)}")
                import traceback
                traceback.print_exc()

        print(f"🎉 Successfully submitted confirmation with status: {status}")
        return jsonify({
            'success': True,
            'message': f'Successfully submitted confirmation with status: {status}',
            'confirmationId': confirmation_id
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to submit confirmation',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 27: LOCK CONFIRMATION
# ======================================
@app.route('/api/lock-confirmation', methods=['POST'])
def lock_confirmation():
    try:
        data = request.json
        confirmation_id = data.get('confirmationId')

        if not confirmation_id:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'confirmationId is required'
            }), 400

        print(f"🚀 Locking confirmation {confirmation_id}")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        script_dir = os.path.dirname(os.path.abspath(__file__))

        # Download pending_confirmations.json
        pending_conf_filename = "pending_confirmations.json"
        pending_conf_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{pending_conf_filename}"
        pending_conf_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{pending_conf_file_path}:/content"
        
        pending_conf_temp_path = os.path.join(script_dir, pending_conf_filename)
        pending_confirmations_data = {"confirmations": []}
        
        try:
            pending_conf_resp = requests.get(pending_conf_download_url, headers=headers)
            if pending_conf_resp.status_code == 200:
                with open(pending_conf_temp_path, "wb") as f:
                    f.write(pending_conf_resp.content)
                with open(pending_conf_temp_path, "r", encoding="utf-8") as f:
                    pending_confirmations_data = json.load(f)
        except:
            pass  # Create new if doesn't exist

        # Ensure confirmations array exists
        if "confirmations" not in pending_confirmations_data:
            pending_confirmations_data["confirmations"] = []

        # Find and update the confirmation
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        confirmation_found = False

        for conf in pending_confirmations_data["confirmations"]:
            if conf.get("id") == confirmation_id:
                confirmation_found = True
                conf["status"] = "locked"
                conf["lockedAt"] = now
                break

        if not confirmation_found:
            return jsonify({
                'error': 'Confirmation not found',
                'message': f'Confirmation with ID {confirmation_id} not found'
            }), 404

        # Save updated pending confirmations
        with open(pending_conf_temp_path, "w", encoding="utf-8") as f:
            json.dump(pending_confirmations_data, f, indent=4)

        # Upload pending confirmations
        section_list = ["pending_confirmations"]
        jugg(
            file_path=pending_conf_temp_path,
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
        if os.path.exists(pending_conf_temp_path):
            os.remove(pending_conf_temp_path)

        print(f"🎉 Successfully locked confirmation")
        return jsonify({
            'success': True,
            'message': 'Successfully locked confirmation',
            'confirmationId': confirmation_id
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to lock confirmation',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 28: GET PENDING CONFIRMATIONS
# ======================================
@app.route('/api/get-pending-confirmations', methods=['GET'])
def get_pending_confirmations():
    try:
        print(f"🚀 Fetching pending confirmations from SharePoint")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        # Download pending_confirmations.json
        pending_conf_filename = "pending_confirmations.json"
        pending_conf_file_path = f"{fy_year}/{folder_name}/{sub_folder_name}/{pending_conf_filename}"
        pending_conf_download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{pending_conf_file_path}:/content"
        
        try:
            pending_conf_resp = requests.get(pending_conf_download_url, headers=headers)
            if pending_conf_resp.status_code == 200:
                # Handle binary download
                script_dir = os.path.dirname(os.path.abspath(__file__))
                temp_file_path = os.path.join(script_dir, "temp_pending_get.json")
                with open(temp_file_path, "wb") as f:
                    f.write(pending_conf_resp.content)
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    pending_confirmations_data = json.load(f)
                
                # Normalize existing data - update old values to new ones
                # Get auditor info from people_data.json for normalization
                auditor_name = "Auditor"
                auditor_email = "auditor@testcloud.com"
                try:
                    people_data_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/people_data.json:/content"
                    people_resp = requests.get(people_data_url, headers=headers)
                    if people_resp.status_code == 200:
                        people_temp_path = os.path.join(script_dir, "temp_people_normalize.json")
                        with open(people_temp_path, "wb") as f:
                            f.write(people_resp.content)
                        with open(people_temp_path, "r", encoding="utf-8") as f:
                            people_data = json.load(f)
                        if "auditors" in people_data and len(people_data["auditors"]) > 0:
                            first_auditor = people_data["auditors"][0]
                            auditor_name = first_auditor.get("name", "Auditor")
                            auditor_email = first_auditor.get("email", "auditor@testcloud.com")
                        if os.path.exists(people_temp_path):
                            os.remove(people_temp_path)
                except:
                    pass  # Use defaults if can't fetch
                
                # Update all confirmations with correct values
                updated = False
                if "confirmations" in pending_confirmations_data:
                    for conf in pending_confirmations_data["confirmations"]:
                        if conf.get("auditFirm") == "Juggernaut Enterprises" or conf.get("auditFirm") == "":
                            conf["auditFirm"] = "Test Cloud"
                            updated = True
                        if conf.get("auditorEmail") == "auditor@juggernaut.com" or conf.get("auditorEmail") == "":
                            conf["auditorEmail"] = auditor_email
                            updated = True
                        if conf.get("auditorName") == "Auditor" or (conf.get("auditorName") == "" and auditor_name != "Auditor"):
                            conf["auditorName"] = auditor_name
                            updated = True
                        if conf.get("confirmationFor") == "":
                            conf["confirmationFor"] = "Test Client"
                            updated = True
                
                # If we updated any values, save back to SharePoint
                if updated:
                    pending_conf_temp_path = os.path.join(script_dir, "temp_pending_normalize.json")
                    with open(pending_conf_temp_path, "w", encoding="utf-8") as f:
                        json.dump(pending_confirmations_data, f, indent=4)
                    
                    section_list = ["pending_confirmations"]
                    jugg(
                        file_path=pending_conf_temp_path,
                        reference_value="",
                        folder_name=folder_name,
                        sub_folder_name=sub_folder_name,
                        fy_year=fy_year,
                        section_list=section_list,
                        headers=headers,
                        site_id=site_id,
                        drive_id=drive_id
                    )
                    
                    if os.path.exists(pending_conf_temp_path):
                        os.remove(pending_conf_temp_path)
                    print(f"✅ Normalized pending confirmations data")
                
                # Clean up temp file
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                
                print(f"✅ Loaded pending confirmations from SharePoint")
                return jsonify({
                    'success': True,
                    'data': pending_confirmations_data
                })
            else:
                return jsonify({
                    'success': True,
                    'data': {"confirmations": []},
                    'message': f'File {pending_conf_filename} does not exist, returning empty structure'
                })
        except Exception as e:
            print(f"ℹ️ Could not download file: {str(e)}")
            return jsonify({
                'success': True,
                'data': {"confirmations": []},
                'message': f'File {pending_conf_filename} does not exist, returning empty structure'
            })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to fetch pending confirmations',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 29: LOCK SAMPLING METHOD
# ======================================
@app.route('/api/lock-sampling-method', methods=['POST'])
def lock_sampling_method():
    try:
        data = request.json
        area = data.get('area')
        sample_set_name = data.get('sampleSetName')
        sampling_method = data.get('samplingMethod')  # "random" or "mus"
        simple_method = data.get('simpleMethod')  # "number" or "calculator" (only for random)

        if not area or not sample_set_name or not sampling_method:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'area, sampleSetName, and samplingMethod are required'
            }), 400

        # Get area code from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}. Area not found in Sections.json'
            }), 400

        print(f"🚀 Locking sampling method for '{sample_set_name}' in area '{area}' ({area_code})")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_filename = "audit_areas.json"
        temp_file_path = os.path.join(script_dir, output_filename)
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{output_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing data
        data_dict = DEFAULT_STRUCTURE.copy()
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # Handle binary download
                with open(temp_file_path, "wb") as f:
                    f.write(download_resp.content)
                with open(temp_file_path, "r", encoding="utf-8") as f:
                    data_dict = json.load(f)
        except:
            pass  # Use default if doesn't exist

        # Ensure the area code exists
        if area_code not in data_dict:
            data_dict[area_code] = []
        
        # Convert old string list format to new object format if needed
        if isinstance(data_dict[area_code], list):
            converted_list = []
            for item in data_dict[area_code]:
                if isinstance(item, str):
                    # Old format: just a string, convert to new format
                    converted_list.append({item: {"locked": False}})
                elif isinstance(item, dict):
                    # Already in new format
                    converted_list.append(item)
            data_dict[area_code] = converted_list
        
        # Find and update the sample set, or add it if it doesn't exist
        sample_set_found = False
        for i, item in enumerate(data_dict[area_code]):
            if isinstance(item, dict) and sample_set_name in item:
                # Update existing sample set
                data_dict[area_code][i][sample_set_name]["samplingMethod"] = sampling_method
                if simple_method:
                    data_dict[area_code][i][sample_set_name]["simpleMethod"] = simple_method
                data_dict[area_code][i][sample_set_name]["locked"] = True
                sample_set_found = True
                break
        
        # Add new sample set if it doesn't exist
        if not sample_set_found:
            new_sample_set = {
                sample_set_name: {
                    "samplingMethod": sampling_method,
                    "locked": True
                }
            }
            if simple_method:
                new_sample_set[sample_set_name]["simpleMethod"] = simple_method
            data_dict[area_code].append(new_sample_set)

        # Save updated data
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(data_dict, f, indent=4)

        # Upload to SharePoint
        section_list = ["audit_areas"]
        jugg(
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

        print(f"🎉 Successfully locked sampling method for '{sample_set_name}'")
        return jsonify({
            'success': True,
            'message': f'Successfully locked sampling method for "{sample_set_name}"',
            'data': data_dict[area_code][sample_set_name]
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to lock sampling method',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 30: LOCK RECIPIENT AND TEMPLATE SELECTIONS
# ======================================
@app.route('/api/lock-recipient-template-selections', methods=['POST'])
def lock_recipient_template_selections():
    try:
        data = request.json
        area = data.get('area')
        sample_set_name = data.get('sampleSetName')
        selections = data.get('selections')  # Array of {sampleId, recipientName, recipientEmail, templateName}

        if not area or not sample_set_name or not selections:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'area, sampleSetName, and selections are required'
            }), 400

        # Get area code from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}. Area not found in Sections.json'
            }), 400

        print(f"🚀 Locking recipient/template selections for '{sample_set_name}' in area '{area}' ({area_code})")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        import tempfile
        confirmation_filename = f"confirmation_{area_code}.json"
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{confirmation_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing confirmation data
        confirmation_data = {}
        temp_file_path = None
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # Use temporary file for download
                with tempfile.NamedTemporaryFile(mode='wb', suffix='.json', delete=False) as temp_file:
                    temp_file.write(download_resp.content)
                    temp_file_path = temp_file.name
                
                try:
                    with open(temp_file_path, "r", encoding="utf-8") as f:
                        confirmation_data = json.load(f)
                    
                    # Convert to dict format if it's a list
                    if isinstance(confirmation_data, list):
                        confirmation_data = {entry.get("sample_id", f"temp_{i}"): {k: v for k, v in entry.items() if k != "sample_id"} for i, entry in enumerate(confirmation_data)}
                finally:
                    # Clean up download temp file
                    if temp_file_path and os.path.exists(temp_file_path):
                        os.unlink(temp_file_path)
        except:
            pass  # Create new if doesn't exist

        # Update each sample with locked recipient and template
        for selection in selections:
            sample_id = selection.get('sampleId')
            template_name = selection.get('templateName', '')
            if sample_id and sample_id in confirmation_data:
                confirmation_data[sample_id]["recipientName"] = selection.get('recipientName', '')
                confirmation_data[sample_id]["recipientEmail"] = selection.get('recipientEmail', '')
                confirmation_data[sample_id]["selectedTemplate"] = template_name
                confirmation_data[sample_id]["selectionsLocked"] = True
                
                # Update the area field in partydetails with the selected template name
                if "partydetails" in confirmation_data[sample_id]:
                    confirmation_data[sample_id]["partydetails"]["area"] = template_name
                    print(f"  ✅ Updated area for {sample_id}: '{template_name}'")
                else:
                    # Create partydetails if it doesn't exist
                    confirmation_data[sample_id]["partydetails"] = {
                        "area": template_name
                    }
                    print(f"  ✅ Created partydetails with area '{template_name}' for {sample_id}")

        # Save updated data to temporary file for upload (with correct filename)
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, confirmation_filename)
        
        try:
            # Write JSON data to temporary file with correct name
            with open(temp_file_path, "w", encoding="utf-8") as temp_file:
                json.dump(confirmation_data, temp_file, indent=4)
            
            # Upload to SharePoint
            section_list = [f"confirmation_{area_code}"]
            jugg(
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
        finally:
            # Clean up temp file and directory
            try:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                if os.path.exists(temp_dir):
                    os.rmdir(temp_dir)
            except Exception:
                pass

        print(f"🎉 Successfully locked recipient/template selections for '{sample_set_name}'")
        return jsonify({
            'success': True,
            'message': f'Successfully locked recipient/template selections for "{sample_set_name}"',
            'lockedCount': len(selections)
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to lock recipient/template selections',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 28: UPDATE SAMPLE AREA WITH SELECTED TEMPLATE
# ======================================
@app.route('/api/update-sample-area', methods=['POST'])
def update_sample_area():
    try:
        data = request.json
        area = data.get('area')  # The audit area (e.g., "Trade Receivables")
        sample_id = data.get('sampleId')
        template_name = data.get('templateName')  # The selected template name

        if not area or not sample_id or not template_name:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'area, sampleId, and templateName are required'
            }), 400

        # Get area code from sections data
        sections_data = get_sections_data()
        area_code = get_area_code_from_sections(sections_data, area)
        if not area_code:
            return jsonify({
                'error': 'Invalid area',
                'message': f'Invalid area name: {area}. Area not found in Sections.json'
            }), 400

        print(f"🚀 Updating area for sample {sample_id} to '{template_name}' in area '{area}' ({area_code})")

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        import tempfile
        confirmation_filename = f"confirmation_{area_code}.json"
        
        file_path_on_sharepoint = f"{fy_year}/{folder_name}/{sub_folder_name}/{confirmation_filename}"
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path_on_sharepoint}:/content"
        
        # Load existing confirmation data
        confirmation_data = {}
        temp_file_path = None
        try:
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                # Use temporary file for download
                with tempfile.NamedTemporaryFile(mode='wb', suffix='.json', delete=False) as temp_file:
                    temp_file.write(download_resp.content)
                    temp_file_path = temp_file.name
                
                try:
                    with open(temp_file_path, "r", encoding="utf-8") as f:
                        confirmation_data = json.load(f)
                    
                    # Convert to dict format if it's a list
                    if isinstance(confirmation_data, list):
                        confirmation_data = {entry.get("sample_id", f"temp_{i}"): {k: v for k, v in entry.items() if k != "sample_id"} for i, entry in enumerate(confirmation_data)}
                finally:
                    # Clean up download temp file
                    if temp_file_path and os.path.exists(temp_file_path):
                        os.unlink(temp_file_path)
        except:
            return jsonify({
                'error': 'Confirmation file not found',
                'message': f'Confirmation file for area {area} not found'
            }), 404

        # Update the area field for the sample
        if sample_id in confirmation_data:
            # Update selectedTemplate
            confirmation_data[sample_id]["selectedTemplate"] = template_name
            
            # Update the area field in partydetails
            if "partydetails" in confirmation_data[sample_id]:
                old_area = confirmation_data[sample_id]["partydetails"].get("area", "")
                confirmation_data[sample_id]["partydetails"]["area"] = template_name
                print(f"  ✅ Updated area for {sample_id}: '{old_area}' -> '{template_name}'")
            else:
                # Create partydetails if it doesn't exist
                confirmation_data[sample_id]["partydetails"] = {
                    "area": template_name
                }
                print(f"  ✅ Created partydetails with area '{template_name}' for {sample_id}")

            # Save updated data to temporary file for upload (with correct filename)
            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, confirmation_filename)
            
            try:
                # Write JSON data to temporary file with correct name
                with open(temp_file_path, "w", encoding="utf-8") as temp_file:
                    json.dump(confirmation_data, temp_file, indent=4)
                
                # Upload to SharePoint
                section_list = [f"confirmation_{area_code}"]
                jugg(
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
            finally:
                # Clean up temp file and directory
                try:
                    if os.path.exists(temp_file_path):
                        os.unlink(temp_file_path)
                    if os.path.exists(temp_dir):
                        os.rmdir(temp_dir)
                except Exception:
                    pass

            print(f"🎉 Successfully updated area for sample {sample_id}")
            return jsonify({
                'success': True,
                'message': f'Successfully updated area for sample {sample_id}',
                'sampleId': sample_id,
                'area': template_name
            })
        else:
            return jsonify({
                'error': 'Sample not found',
                'message': f'Sample with ID {sample_id} not found in confirmation file'
            }), 404

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to update sample area',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 31: CREATE CUSTOM TEMPLATE
# ======================================
@app.route('/api/create-custom-template', methods=['POST'])
def create_custom_template():
    try:
        data = request.json
        template_name = data.get('templateName')
        elements = data.get('elements', [])

        if not template_name:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'templateName is required'
            }), 400

        print(f"🚀 Creating custom template: {template_name}")
        print(f"📋 Received {len(elements)} elements")

        # Sort elements by order to preserve creation order
        sorted_elements = sorted(elements, key=lambda x: x.get("order", 0))
        print(f"📋 Processing elements in order: {[e.get('order', 0) for e in sorted_elements]}")

        # Build template structure - use a single counter to preserve order across all types
        template_json = {}
        element_counter = 0
        textbox_count = 1
        table_count = 1
        confirming_party_textbox_count = 1

        for element in sorted_elements:
            element_type = element.get("type")
            element_counter += 1

            # TEXTBOX
            if element_type == "text":
                key = f"textbox_{textbox_count}"
                text_content = element.get("textContent", "")
                template_json[key] = text_content
                print(f"  ✅ Added {key} (order {element_counter}): {len(text_content)} chars")
                if element.get("footnote"):
                    print(f"     Footnote: {element.get('footnote')}")
                textbox_count += 1

            # CONFIRMING PARTY TEXTBOX
            elif element_type == "confirmingPartyTextBox":
                key = f"ConfirmingPartyTextBox_{confirming_party_textbox_count}"
                template_json[key] = [{
                    "heading": element.get("heading", ""),
                    "subheading": element.get("subheading", ""),
                    "user_response": ""
                }]
                print(f"  ✅ Added {key} (order {element_counter})")
                confirming_party_textbox_count += 1

            # TABLE
            elif element_type == "table":
                key = f"table_{table_count}"
                table_count += 1

                # Extract table data from element
                # First try to get columns directly from element (frontend sends them)
                columns = element.get("columns", [])
                print(f"     Columns from element: {columns}")
                
                # If not found, try to extract from tableData structure
                if not columns:
                    table_data = element.get("tableData", {})
                    header_row = table_data.get("headerRow", {})
                    if header_row and header_row.get("cells"):
                        # PRESERVE ALL column names exactly as entered, including empty ones
                        # Try both 'content' and 'value' properties
                        columns = []
                        for cell in header_row["cells"]:
                            col_name = cell.get("content") or cell.get("value") or ""
                            columns.append(col_name)
                        print(f"     Columns from tableData: {columns}")

                # Build rows from element (frontend sends them)
                rows = element.get("rows", [])
                
                # If not found, try to extract from tableData structure
                if not rows:
                    table_data = element.get("tableData", {})
                    data_rows = table_data.get("dataRows", [])
                    for data_row in data_rows:
                        if data_row.get("cells"):
                            row_obj = {}
                            for i, cell in enumerate(data_row["cells"]):
                                col_name = columns[i] if i < len(columns) else f"Column {i+1}"
                                # Try both 'content' and 'value' properties
                                cell_value = cell.get("content") or cell.get("value") or ""
                                row_obj[col_name] = cell_value
                            rows.append(row_obj)

                # If still no rows, create one empty row with proper column structure
                if not rows:
                    if columns:
                        # Create row with actual column names
                        empty_row = {}
                        for col in columns:
                            empty_row[col if col else f"Column {columns.index(col) + 1}"] = ""
                        rows = [empty_row]
                    else:
                        rows = [{}]

                table_heading = element.get("heading", "")
                table_subheading = element.get("subheading", "")
                footnote_text = element.get("footnote", "")
                
                template_json[key] = {
                    "heading": table_heading,
                    "subheading": table_subheading,
                    "columns": columns,
                    "rows": rows,
                    "footnote_1": footnote_text
                }
                
                print(f"  ✅ Added {key} (order {element_counter}):")
                print(f"     Heading: '{table_heading}'")
                print(f"     Columns ({len(columns)}): {columns}")
                print(f"     Rows: {len(rows)}")
                if footnote_text:
                    print(f"     Footnote: {footnote_text}")

        # Add mandatory elements
        template_json["remarks"] = ""
        template_json["attachments"] = []
        template_json["confirmingpartystatement"] = [{
            "statement": "We certify that the above particulars (read alongwith the attachments if any) are full and correct and do not exclude any other amount receivable from us of this nature.",
            "response": ""
        }]
        template_json["confirmingpartydetails"] = {
            "organizationName": "",
            "name": "",
            "designation": ""
        }

        # Create final template structure
        templates_data = {template_name: {"templateDetails": template_json}}

        # Get access token and SharePoint info
        access_token = get_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get site ID
        site_resp = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_hostname}:{site_path}",
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

        script_dir = os.path.dirname(os.path.abspath(__file__))
        templates_file_name = "create_template.json"
        temp_file_path = os.path.join(script_dir, templates_file_name)

        # Download existing templates if they exist
        existing_templates = {}
        try:
            download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{fy_year}/{folder_name}/{sub_folder_name}/{templates_file_name}:/content"
            download_resp = requests.get(download_url, headers=headers)
            if download_resp.status_code == 200:
                existing_templates = download_resp.json()
                print(f"✅ Loaded existing templates")
        except:
            print(f"ℹ️ No existing templates file, creating new one")

        # Merge new template with existing templates
        existing_templates.update(templates_data)

        # Save to temp file
        with open(temp_file_path, "w", encoding="utf-8") as f:
            json.dump(existing_templates, f, indent=2)

        # Upload to SharePoint
        section_list = ["create_template"]
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

        print(f"🎉 Successfully created and uploaded template: {template_name}")
        return jsonify({
            'success': True,
            'message': f'Successfully created template: {template_name}',
            'templateName': template_name,
            'fileUrl': file_web_url
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to create custom template',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT 32: GET TEMPLATE (STANDARD OR CUSTOM)
# ======================================
@app.route('/api/get-custom-template', methods=['POST'])
def get_custom_template():
    try:
        data = request.json
        template_name = data.get('templateName')

        if not template_name:
            return jsonify({
                'error': 'Missing required fields',
                'message': 'templateName is required'
            }), 400

        print(f"🚀 Getting template: {template_name}")

        # Read from local file instead of SharePoint
        script_dir = os.path.dirname(os.path.abspath(__file__))
        template_data = None

        # First try Confirmation_Template.json for standard templates
        template_file_name = "Confirmation_Template.json"
        template_file_path = os.path.join(script_dir, template_file_name)

        try:
            if os.path.exists(template_file_path):
                with open(template_file_path, "r", encoding="utf-8") as f:
                    templates_data = json.load(f)
                if template_name in templates_data:
                    template_data = templates_data[template_name]
                    print(f"✅ Successfully retrieved standard template: {template_name} from {template_file_name}")
        except Exception as e:
            print(f"⚠️ Error loading {template_file_name}: {str(e)}")

        # If not found in standard templates, try create_template.json for custom templates
        if not template_data:
            template_file_name = "create_template.json"
            template_file_path = os.path.join(script_dir, template_file_name)

            try:
                if os.path.exists(template_file_path):
                    with open(template_file_path, "r", encoding="utf-8") as f:
                        templates_data = json.load(f)
                    if template_name in templates_data:
                        template_data = templates_data[template_name]
                        print(f"✅ Successfully retrieved custom template: {template_name} from {template_file_name}")
            except Exception as e:
                print(f"⚠️ Error loading {template_file_name}: {str(e)}")

        # Return template data if found
        if template_data:
            return jsonify({
                'success': True,
                'message': f'Successfully retrieved template: {template_name}',
                'templateName': template_name,
                'templateData': template_data
            })
        else:
            return jsonify({
                'error': 'Template not found',
                'message': f'Template "{template_name}" not found in Confirmation_Template.json or create_template.json'
            }), 404

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get template',
            'message': str(e)
        }), 500

# ======================================
# API ENDPOINT: GET SECTIONS
# ======================================
@app.route('/api/get-sections', methods=['GET'])
def get_sections():
    try:
        # Configuration for Sections.json
        sections_doc_library = "Test15"
        sections_fy_year = "Test15_FY25"
        sections_folder_name = "juggernaut"
        sections_file_name = "Sections.json"
        
        print(f"🚀 Downloading sections file: {sections_file_name}")

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
            raise Exception(f"Library '{sections_doc_library}' not found in site '{site_path}'")

        # Download file from SharePoint
        download_url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{sections_fy_year}/{sections_folder_name}/{sections_file_name}:/content"
        
        try:
            download_resp = requests.get(download_url, headers=headers)
            download_resp.raise_for_status()
            
            # Read the JSON content
            sections_data = download_resp.json()
            
            print(f"✅ Successfully downloaded {sections_file_name}")
            
            return jsonify({
                'success': True,
                'message': 'Successfully downloaded sections data',
                'data': sections_data
            })
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # File doesn't exist, return error
                print(f"❌ File {sections_file_name} does not exist on SharePoint")
                return jsonify({
                    'success': False,
                    'error': 'File not found',
                    'message': f'File {sections_file_name} does not exist on SharePoint'
                }), 404
            else:
                raise

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get sections data',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=3002, debug=True)

