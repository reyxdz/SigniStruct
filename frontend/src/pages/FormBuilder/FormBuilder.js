import React, { useState } from 'react';

const FormBuilder = ({ formId }) => {
  const [formName, setFormName] = useState('Untitled Form');
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  const addField = (type) => {
    const newField = {
      id: Date.now(),
      type,
      label: `${type} Field`,
      required: false,
      placeholder: '',
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id, updates) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
    setSelectedFieldId(null);
  };

  const publishForm = () => {
    alert('Form published! You can now share it with others.');
  };

  return (
    <div className="form-builder">
      <div className="builder-header">
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="form-title-input"
          placeholder="Form Title"
        />
        <div className="builder-actions">
          <button className="btn btn-secondary">Save Draft</button>
          <button className="btn btn-primary" onClick={publishForm}>Publish Form</button>
        </div>
      </div>

      <div className="builder-container">
        {/* Toolbar */}
        <div className="builder-toolbar">
          <h3>Add Fields</h3>
          <div className="field-buttons">
            <button onClick={() => addField('text')} className="field-btn">Text</button>
            <button onClick={() => addField('email')} className="field-btn">Email</button>
            <button onClick={() => addField('phone')} className="field-btn">Phone</button>
            <button onClick={() => addField('textarea')} className="field-btn">Textarea</button>
            <button onClick={() => addField('select')} className="field-btn">Select</button>
            <button onClick={() => addField('checkbox')} className="field-btn">Checkbox</button>
            <button onClick={() => addField('radio')} className="field-btn">Radio</button>
            <button onClick={() => addField('date')} className="field-btn">Date</button>
            <button onClick={() => addField('signature')} className="field-btn">Signature</button>
          </div>
        </div>

        {/* Canvas */}
        <div className="builder-canvas">
          <div className="form-preview">
            <h2>{formName}</h2>
            {fields.length === 0 ? (
              <p className="empty-canvas">Add fields to your form using the toolbar on the left</p>
            ) : (
              fields.map(field => (
                <div
                  key={field.id}
                  className={`field-item ${selectedFieldId === field.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFieldId(field.id)}
                >
                  <label>{field.label} {field.required && <span className="required">*</span>}</label>
                  <input type={field.type} placeholder={field.placeholder || 'Enter value'} disabled />
                  <button className="remove-field" onClick={() => removeField(field.id)}>×</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedFieldId && (
          <div className="builder-properties">
            <h3>Field Properties</h3>
            {fields.find(f => f.id === selectedFieldId) && (
              <div className="properties-form">
                <div className="property-group">
                  <label>Label</label>
                  <input
                    type="text"
                    value={fields.find(f => f.id === selectedFieldId).label}
                    onChange={(e) => updateField(selectedFieldId, { label: e.target.value })}
                  />
                </div>
                <div className="property-group">
                  <label>Placeholder</label>
                  <input
                    type="text"
                    value={fields.find(f => f.id === selectedFieldId).placeholder}
                    onChange={(e) => updateField(selectedFieldId, { placeholder: e.target.value })}
                  />
                </div>
                <div className="property-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={fields.find(f => f.id === selectedFieldId).required}
                      onChange={(e) => updateField(selectedFieldId, { required: e.target.checked })}
                    />
                    Required Field
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
