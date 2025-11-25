const Form = require("../models/Form");
const { appendFormDataToSheet } = require("../Helper/googleSheet");
const {
  ringbaId: serverRingbaIds,
  baseRingbaUrl,
} = require("../api/ringbaUrls");
const { successResponse, errorResponse } = require("../utils/response");
const axios = require("axios");
const fieldConfig = require("./fieldConfig");
const stateNameToCode = require("./stateNameToCode");
const fieldMap = {
  phone: "callerid",
  zipcode: "ZipCode",
  exposeCallerId: "exposeCallerId",
  agentName: "agentname",
  fname: "firstname",
  lname: "lastname",
  email: "email",
  city: "city",
  state: "state",
  address: "address",
  dob: "dob",
  jornaya_leadid: "jornaya_leadid",
  trusted_id: "trusted_id",
  ip_address: "ip_address",
  Age: "Age",

};
const formatDateToMMDDYYYY = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};
const createForm = async (req, res) => {
  try {
    const formData = req.body;
    const {
      campaign,
      publisher,
      ringbaId: clientRingbaId,
      jornaya_leadid,
      ip,
    } = formData;
    if (formData._id) {
      delete formData._id;
    }
    const stateFullName = formData.state;
    const stateAbbr = stateNameToCode[stateFullName];
    formData.state = stateAbbr;
    const savedForm = await Form.create(formData);
    await appendFormDataToSheet(formData, "Form");
    if (publisher === "BaliTech" && (!jornaya_leadid || !ip)) {
      const campaignsToTry = ["ACA", "FE", "SSDI","U65"];
      try {
        for (let camp of campaignsToTry) {
          const scrubberResponse = await axios.get(
            `https://scrubber.balitech.org/api/search.php?phone=${formData.phone}&campaign=${camp}`
          );
          const scrubDataList = scrubberResponse.data?.data?.data;

          if (Array.isArray(scrubDataList)) {
            for (let record of scrubDataList) {
              const leadId = record[4];
              const ipAddr = record[5];
              const tf = record[7];

              if (leadId || ipAddr || tf) {
                formData.jornaya_leadid = formData.jornaya_leadid || leadId;
                formData.ip_address = formData.ip_address || ipAddr;
                formData.trusted_form = formData.trusted_form || tf;
                break;
              }
            }
          }

          if (formData.jornaya_leadid && formData.ip_address) break;
        }
      } catch (scrubErr) {
        console.error("Failed to fetch from scrubber API:", scrubErr.message);
      }
      if (!formData.jornaya_leadid || !formData.ip_address) {
        return errorResponse(
          res,
          "Missing required fields: jornaya_leadid or ip_address"
        );
      }
    }

    const correctRingbaId =
      clientRingbaId || serverRingbaIds[publisher]?.[campaign];

    if (correctRingbaId) {
      const fullRingbaUrl = `${baseRingbaUrl}${correctRingbaId}`;
      const campaignFields =
        fieldConfig[publisher]?.[campaign] ||
        fieldConfig[publisher]?.["AnyCampaign"] ||
        [];

      formData.exposeCallerId = formData.exposeCallerId || "yes";
      if (campaign === "ACA CPL" && formData.dob) {
        formData.dob = formatDateToMMDDYYYY(formData.dob);
      }
      const queryParams = new URLSearchParams();
      campaignFields.forEach((field) => {
        const paramName = fieldMap[field];
        if (paramName && formData[field] !== undefined) {
          queryParams.append(paramName, formData[field]);
        }
      });

      const fullUrlWithQuery = `${fullRingbaUrl}?${queryParams.toString()}`;
      console.log("Calling Ringba:", fullUrlWithQuery);

      const ringbaResponse = await axios.post(fullUrlWithQuery);

      return successResponse(
        res,
        "Form submitted successfully and passed to Ringba",
        {
          savedForm,
          ringbaResponse: ringbaResponse.data,
        }
      );
    }

    return successResponse(res, "Form submitted and saved", { savedForm });
  } catch (error) {
    console.error(
      "Error in createForm:",
      error?.response?.data || error.message
    );
    return errorResponse(
      res,
      error.message || "Server error during form creation"
    );
  }
};
const checkFormByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    let formData = await Form.findOne({ phone: phone });
    if (!formData) {
      formData = await Form.findOne({ phone: Number(phone) });
    }

    if (formData) {
      return res
        .status(200)
        .json({ success: true, message: "Form data found", data: formData });
    } else {
      return res
        .status(200)
        .json({ success: false, message: "No form found for this phone" });
    }
  } catch (error) {
    console.error("Error in checkFormByPhone:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error while checking phone" });
  }
};
const getFieldsByPublisherAndCampaign = async (req, res) => {
  try {
    const { publisher, campaign } = req.query;

    if (!publisher || !campaign) {
      return errorResponse(res, "Publisher and campaign are required");
    }

    const fields = fieldConfig[publisher]?.[campaign] || [];

    return successResponse(res, "Fields loaded", { fields });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const prefillFormData = async (req, res) => {
  try {
    const { phone, publisher, campaign } = req.query;

    if (!phone) return errorResponse(res, "Phone required");

    // Find from DB
    const savedForm = await Form.findOne({ phone });

    if (!savedForm) {
      return successResponse(res, "No previous record", { data: null });
    }

    // Fetch allowed fields for this campaign
    const allowedFields =
      fieldConfig[publisher]?.[campaign] ||
      fieldConfig[publisher]?.["AnyCampaign"] ||
      [];

    // Filter only those keys
    const prefilledData = {};
    allowedFields.forEach((f) => {
      if (savedForm[f] !== undefined) {
        prefilledData[f] = savedForm[f];
      }
    });

    return successResponse(res, "Prefill data found", {
      data: prefilledData,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
module.exports = {
 createForm,
  checkFormByPhone,
  getFieldsByPublisherAndCampaign,
  prefillFormData
};
