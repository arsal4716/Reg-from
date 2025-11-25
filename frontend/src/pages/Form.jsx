import React, { useState, useEffect } from "react";
import InputFields from "../InputFields/InputFields";
import { usStates } from "../utils/usStates";
import { useForm } from "../hooks/useForm";
import Navbar from "./../components/Navbar";
import Loader from "../components/Loader";
import { submitForm } from "../services/authService";
import { toast } from "react-toastify";
import { campaignRelations } from "../Relation/campaignRelations";
import { getPublisherName, getAgentName } from "../utils/authStorage";
import { ringbaId } from "../Api/ringbaUrls";

const Form = () => {
  const { formData, handleChange, resetForm, handlePhoneChange, checkingPhone } = useForm();
  const [loading, setLoading] = useState(false);
  const [activeFields, setActiveFields] = useState([]);

  const publisher = (getPublisherName() || "").trim();
  const campaigns = campaignRelations[publisher] || [];

  // Fetch fields for selected campaign
  useEffect(() => {
    const fetchFields = async () => {
      if (!formData.campaign) return;

      try {
        const res = await fetch(
          `/api/form/fields?publisher=${publisher}&campaign=${formData.campaign}`
        );
        const result = await res.json();
        if (result.success) {
          const backendToFrontendMap = {
            firstname: "fname",
            lastname: "lname",
            agentname: "agentName",
            ZipCode: "zipcode",
          };
          const mappedFields = Array.from(
            new Set(result.data.fields.map(f => backendToFrontendMap[f] || f))
          );
          setActiveFields(mappedFields);
        }
      } catch (err) {
        console.error("Error fetching fields:", err);
      }
    };
    fetchFields();
  }, [formData.campaign, publisher]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ringbaIdForCampaign = ringbaId[publisher]?.[formData.campaign] || "";

      if (!ringbaIdForCampaign && !(publisher === "BaliTech" && formData.campaign === "OAK Lead")) {
        toast.error("Invalid campaign or publisher selected!");
        setLoading(false);
        return;
      }

      const submitData = {
        ...formData,
        publisher,
        agentName: getAgentName(),
        campaign: formData.campaign,
        ringbaId: ringbaIdForCampaign,
      };

      const data = await submitForm(submitData);
      toast.success(data.message);
      resetForm();
      setActiveFields([]);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="card shadow p-4 w-75">
          <h3 className="mb-4 text-center">Customer Details</h3>
          <p className="text-danger">Please select a campaign name before filling out the form.</p>

          <form onSubmit={handleSubmit}>
            {/* Campaign dropdown */}
            <div className="row mb-3">
              <div className="col-md-6">
                <InputFields
                  label="Campaign Name"
                  type="select"
                  name="campaign"
                  value={formData.campaign}
                  onChange={handleChange}
                  options={campaigns}
                  required
                />
              </div>
            </div>

            <div className="row">
              {activeFields.map((field) => {
                if (["agentName", "exposeCallerId"].includes(field)) {
                  return (
                    <div className="col-md-6 mb-3" key={field}>
                      <InputFields
                        label={field === "agentName" ? "Agent Name" : "Expose Caller ID"}
                        name={field}
                        type="text"
                        value={formData[field] || ""}
                        readOnly
                      />
                    </div>
                  );
                }

                if (["jornaya_leadid", "ip_address", "trusted_id"].includes(field)) {
                  return (
                    <div className="col-md-6 mb-3" key={field}>
                      <InputFields
                        label={field}
                        name={field}
                        type="text"
                        value={formData[field] || ""}
                        onChange={handleChange}
                        placeholder={`Enter ${field}`}
                        required
                      />
                    </div>
                  );
                }

                if (field === "state") {
                  return (
                    <div className="col-md-6 mb-3" key={field}>
                      <label className="form-label">
                        State <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        name="state"
                        value={formData.state || ""}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select State</option>
                        {Object.entries(usStates).map(([abbr, name]) => (
                          <option key={abbr} value={abbr}>{name}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field === "phone") {
                  return (
                    <div className="col-md-6 mb-3 position-relative" key={field}>
                      <InputFields
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => handlePhoneChange(e, setActiveFields, publisher)}
                        placeholder="123-456-7890"
                        required
                      />
                      {checkingPhone && (
                        <div className="position-absolute" style={{ top: "50%", right: "10px", transform: "translateY(-50%)" }}>
                          <Loader size="sm" />
                        </div>
                      )}
                    </div>
                  );
                }

                if (field === "zipcode") {
                  return (
                    <div className="col-md-6 mb-3" key={field}>
                      <InputFields
                        label="Zip Code"
                        name="zipcode"
                        type="number"
                        value={formData.zipcode || ""}
                        onChange={handleChange}
                        placeholder="12345"
                        required
                      />
                    </div>
                  );
                }

                const type = field === "dob" ? "date" : "text";
                const label = field.charAt(0).toUpperCase() + field.slice(1);

                return (
                  <div className="col-md-6 mb-3" key={field}>
                    <InputFields
                      label={label}
                      name={field}
                      type={type}
                      value={formData[field] || ""}
                      onChange={handleChange}
                      placeholder={`Enter ${label}`}
                      required
                    />
                  </div>
                );
              })}
            </div>

            <div className="d-flex justify-content-center">
              <button type="submit" className="btn btn-primary w-50 mt-3" disabled={loading}>
                {loading ? <Loader size="sm" message="Submitting..." /> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Form;
