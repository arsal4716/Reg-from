import { useEffect, useState } from "react";
import { getAgentName } from "../utils/authStorage";
import { toast } from "react-toastify";
import axios from "axios";

const defaultFields = {
  fname: "",
  lname: "",
  phone: "",
  email: "",
  zipcode: "",
  city: "",
  state: "",
  address: "",
  agentName: "",
  campaign: "",
  dob: "",
  jornaya_leadid: "",
  ip_address: "",
  Age: "",
  trusted_id: "",
  exposeCallerId: "Yes",
};

export const useForm = () => {
  const [formData, setFormData] = useState(defaultFields);
  const [checkingPhone, setCheckingPhone] = useState(false);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      agentName: getAgentName() || "",
      exposeCallerId: "Yes",
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const handlePhoneChange = async (e, activeFieldsSetter, publisher) => {
  const { value } = e.target;
  setFormData((prev) => ({ ...prev, phone: value }));

  if (value.length >= 10) {
    setCheckingPhone(true);
    try {
      const res = await axios.get(`/api/form/check?phone=${value}`);
      if (res.data.success) {
        const data = res.data.data;
        const backendToFrontendMap = {
          firstname: "fname",
          lastname: "lname",
          ZipCode: "zipcode",
          agentname: "agentName",
        };

        const mappedData = {};
        Object.keys(data).forEach((key) => {
          const frontendKey = backendToFrontendMap[key] || key;
          if (frontendKey !== "campaign") {
            mappedData[frontendKey] = data[key];
          }
        });

        setFormData((prev) => ({
          ...prev,
          ...mappedData,
          phone: value,
        }));

        toast.success("Auto-filled existing data.");
        if (activeFieldsSetter && formData.campaign) {
          try {
            const fieldRes = await fetch(
              `/api/form/fields?publisher=${publisher}&campaign=${formData.campaign}`
            );
            const fieldResult = await fieldRes.json();
            if (fieldResult.success) {
              const backendToFrontendMapFields = {
                firstname: "fname",
                lastname: "lname",
                agentname: "agentName",
                ZipCode: "zipcode",
              };
              const mappedFields = Array.from(
                new Set(
                  fieldResult.data.fields.map(
                    (f) => backendToFrontendMapFields[f] || f
                  )
                )
              );
              activeFieldsSetter(mappedFields);
            }
          } catch (err) {
            console.error("Error fetching fields after phone check:", err);
          }
        }
      } else {
        toast.info("New user – no data found.");
      }
    } catch (err) {
      console.error("Error fetching phone data:", err);
      toast.error("Failed to fetch data.");
    } finally {
      setCheckingPhone(false);
    }
  }
};

  const resetForm = () => {
    setFormData({
      ...defaultFields,
      agentName: getAgentName() || "",
      exposeCallerId: "Yes",
    });
  };

  return {
    formData,
    setFormData,
    handleChange,
    handlePhoneChange,
    resetForm,
    checkingPhone,
  };
};
