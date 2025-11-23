import express from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// Configuration
const CONFIG = {
  tenant_id: "114c8106-747f-4cc7-870e-8712e6c23b18",
  client_id: "b357e50c-c5ef-484d-84df-fe470fe76528",
  client_secret: "JAZ8Q~xlY-EDlgbLtgJaqjPNAjsHfYFavwxbkdjE",
  site_hostname: "juggernautenterprises.sharepoint.com",
  site_path: "/sites/TestCloud",
  doc_library: "TestClient",
  fy_year: "TestClient_FY25",
  confirmation_folder: "tools/Confirmation",
  CONFIRM_JSON: "Confirmation.json",
  DB_JSON: "db.json",
  TEMP_CONFIRM: "temp_confirm.json",
  TEMP_DB: "temp_db.json"
};

// SharePoint Auth
async function getAccessToken(): Promise<string> {
  const app = new ConfidentialClientApplication({
    auth: {
      clientId: CONFIG.client_id,
      authority: `https://login.microsoftonline.com/${CONFIG.tenant_id}`,
      clientSecret: CONFIG.client_secret,
    },
  });

  const tokenResponse = await app.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  });

  if (!tokenResponse?.accessToken) {
    throw new Error("Failed to get access token");
  }

  return tokenResponse.accessToken;
}

async function getDriveInfo(headers: Record<string, string>) {
  const siteUrl = `https://graph.microsoft.com/v1.0/sites/${CONFIG.site_hostname}:${CONFIG.site_path}`;
  const siteResp = await axios.get(siteUrl, { headers });
  const siteId = siteResp.data.id;

  const drivesResp = await axios.get(
    `https://graph.microsoft.com/v1.0/sites/${siteId}/drives`,
    { headers }
  );

  const driveId = drivesResp.data.value.find(
    (d: any) => d.name === CONFIG.doc_library
  )?.id;

  if (!driveId) {
    throw new Error(`Document library '${CONFIG.doc_library}' not found!`);
  }

  return { siteId, driveId };
}

// Download file
async function downloadFile(
  headers: Record<string, string>,
  driveId: string,
  filePathOnSharePoint: string,
  localPath: string
) {
  const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${filePathOnSharePoint}:/content`;
  console.log(`⬇ Downloading ${filePathOnSharePoint} ...`);

  const response = await axios.get(downloadUrl, {
    headers,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(localPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(`✔ Downloaded → ${localPath}`);
      resolve(true);
    });
    writer.on('error', reject);
  });
}

// Upload file
async function uploadFile(
  headers: Record<string, string>,
  driveId: string,
  filePathOnSharePoint: string,
  localPath: string
) {
  const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${filePathOnSharePoint}:/content`;
  console.log(`⬆ Uploading ${path.basename(localPath)} ...`);

  const fileContent = fs.readFileSync(localPath);
  await axios.put(uploadUrl, fileContent, { headers });
  console.log("✔ Upload successful!");
}

// Generate template
function generateTemplate() {
  return {
    partydetails: {
      ConfirmingParty: "",
      Recipientname: "",
      RecipientEmail: "",
      area: "",
      amount: "",
      clientName: "",
      clientEmail: "",
      periodenddate: "",
    },
    templateDetails: {},
    activityLog: [
      {
        timestamp: "",
        stage: "",
        action: "",
        performedBy: "",
        details: "",
        status: "",
      },
      {
        timestamp: "",
        stage: "",
        action: "",
        performedBy: "",
        details: "",
        status: "",
      },
    ],
    domaintesting: {
      Domain: "",
      Status: "",
      "Creation Date": "",
      "Expiry Date": "",
      Registrar: "",
      result: "",
    },
  };
}

// Update confirm.json
function updateConfirmJson(sampleId: string, data: any) {
  if (sampleId in data) {
    console.log(`ℹ Sample already exists → ${sampleId}`);
  } else {
    data[sampleId] = generateTemplate();
    console.log(`➕ Added sample to confirm.json → ${sampleId}`);
  }
  return data;
}

// Update db.json
function updateDbJson(fileName: string, sectionList: string[], fileWebUrl: string, dbData: any) {
  if (!dbData.tools) {
    dbData.tools = {};
  }
  if (!dbData.tools.Confirmation) {
    dbData.tools.Confirmation = [];
  }

  const newEntry = {
    name: fileName,
    url: fileWebUrl,
    section: sectionList,
    reference: "",
  };

  const entries = dbData.tools.Confirmation;
  let replaced = false;

  for (let i = 0; i < entries.length; i++) {
    if (entries[i].name === fileName) {
      dbData.tools.Confirmation[i] = newEntry;
      replaced = true;
      console.log("♻ Overwriting db.json entry");
      break;
    }
  }

  if (!replaced) {
    dbData.tools.Confirmation.push(newEntry);
    console.log("➕ Added new entry to db.json");
  }

  return dbData;
}

// Abbreviate function
function abbreviate(text: string): string {
  const parts = text.split(" ");
  if (parts[0].match(/^[A-Za-z0-9]+$/) && /\d/.test(parts[0])) {
    return parts[0].toUpperCase();
  }
  return parts.map((p) => p[0].toUpperCase()).join("");
}

// Generate next sample ID
function generateNextSampleId(
  auditArea: string,
  sampleSetName: string,
  confirmJsonData: any
): string {
  const auditAbbr = abbreviate(auditArea);
  const sampleAbbr = abbreviate(sampleSetName);
  const prefix = `${auditAbbr}_${sampleAbbr}_`;

  const existingIds = Object.keys(confirmJsonData).filter((k) =>
    k.startsWith(prefix)
  );

  if (existingIds.length === 0) {
    return prefix + "001";
  }

  const lastNum = Math.max(
    ...existingIds.map((e) => parseInt(e.split("_").pop() || "0"))
  );
  const nextNum = String(lastNum + 1).padStart(3, "0");

  return prefix + nextNum;
}

// API Route
router.post('/create-sample-set', async (req, res) => {
  try {
    const {
      audit_area,
      sample_set_name,
      confirming_party_name,
      recipient_name,
      email_id,
      amount,
    } = req.body;

    // Validate inputs
    if (!audit_area || !sample_set_name || !confirming_party_name || !recipient_name || !email_id || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log("🚀 STARTING UPDATE PROCESS (confirm.json + db.json)");

    // Auth + Download
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    const { siteId, driveId } = await getDriveInfo(headers);

    const tempConfirmPath = path.join(process.cwd(), CONFIG.TEMP_CONFIRM);
    const tempDbPath = path.join(process.cwd(), CONFIG.TEMP_DB);

    await downloadFile(
      headers,
      driveId,
      `${CONFIG.fy_year}/${CONFIG.confirmation_folder}/${CONFIG.CONFIRM_JSON}`,
      tempConfirmPath
    );

    await downloadFile(
      headers,
      driveId,
      `${CONFIG.fy_year}/juggernaut/${CONFIG.DB_JSON}`,
      tempDbPath
    );

    // Load confirm.json
    const confirmData = JSON.parse(fs.readFileSync(tempConfirmPath, 'utf-8'));

    // Create new sample ID
    const sampleId = generateNextSampleId(audit_area, sample_set_name, confirmData);
    console.log(`🆔 Generated Sample ID → ${sampleId}`);

    // Update confirm.json
    if (!(sampleId in confirmData)) {
      confirmData[sampleId] = generateTemplate();
    }

    confirmData[sampleId].partydetails.ConfirmingParty = confirming_party_name;
    confirmData[sampleId].partydetails.Recipientname = recipient_name;
    confirmData[sampleId].partydetails.RecipientEmail = email_id;
    confirmData[sampleId].partydetails.amount = amount;
    confirmData[sampleId].partydetails.area = audit_area;

    fs.writeFileSync(tempConfirmPath, JSON.stringify(confirmData, null, 2));
    await uploadFile(
      headers,
      driveId,
      `${CONFIG.fy_year}/${CONFIG.confirmation_folder}/${CONFIG.CONFIRM_JSON}`,
      tempConfirmPath
    );

    // Update db.json
    const dbData = JSON.parse(fs.readFileSync(tempDbPath, 'utf-8'));
    const sectionList = [audit_area, sample_set_name];
    const updatedFileUrl = `https://${CONFIG.site_hostname}/sites/TestCloud/${CONFIG.fy_year}/${CONFIG.confirmation_folder}/${CONFIG.CONFIRM_JSON}`;

    const updatedDbData = updateDbJson(CONFIG.CONFIRM_JSON, sectionList, updatedFileUrl, dbData);
    fs.writeFileSync(tempDbPath, JSON.stringify(updatedDbData, null, 2));
    await uploadFile(
      headers,
      driveId,
      `${CONFIG.fy_year}/juggernaut/${CONFIG.DB_JSON}`,
      tempDbPath
    );

    // Cleanup temp files
    fs.unlinkSync(tempConfirmPath);
    fs.unlinkSync(tempDbPath);

    console.log("\n🎉 DONE — Sample Created & Files Updated on SharePoint!");

    res.json({
      success: true,
      sampleId,
      message: 'Sample set created successfully',
    });
  } catch (error: any) {
    console.error('Error creating sample set:', error);
    res.status(500).json({
      error: 'Failed to create sample set',
      message: error.message,
    });
  }
});

export default router;
