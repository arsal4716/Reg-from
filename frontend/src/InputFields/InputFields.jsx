const InputFields = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = true,
  options = [],
}) => {
  const commonProps = {
    className: 'form-control',
    name,
    value,
    onChange,
    placeholder,
    required,
  };

  if (name === 'phone') {
    commonProps.type = 'text';
    commonProps.pattern = '[0-9]{10}'; 
    commonProps.title = 'Phone number must be exactly 10 digits';
    commonProps.maxLength = 10; 
  }

  if (name === 'zipcode') {
    commonProps.type = 'text';
    commonProps.pattern = '[0-9]{5}'; 
    commonProps.title = 'Zip code must be exactly 5 digits';
    commonProps.maxLength = 5; 
  }

  if (type === 'select') {
    return (
      <div className="mb-3">
        <label className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
        <select className="form-select" {...commonProps}>
          <option value="">Select {label}</option>
          {options.map((option, idx) => (
            <option key={idx} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input type={type} {...commonProps} />
    </div>
  );
};

export default InputFields;
