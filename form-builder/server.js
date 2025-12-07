const express = require('express');
const path = require('path');
const XLSX = require('xlsx');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Directus configuration from environment
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://api.studsovet.kosygin-rsu.ru';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || '';

const headers = {
  'Authorization': `Bearer ${DIRECTUS_TOKEN}`,
  'Content-Type': 'application/json'
};

// Helper function to make Directus requests
async function directusRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers
  };
  
  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Directus error ${response.status}: ${errorText}`);
  }
  
  // DELETE returns 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  const data = await response.json();
  return data.data;
}

// ============ FORMS API ============

// Get all forms
app.get('/api/forms', async (req, res) => {
  try {
    const forms = await directusRequest('GET', '/items/forms?sort=-id');
    res.json(forms || []);
  } catch (err) {
    console.error('Error fetching forms:', err);
    res.status(500).json({ error: 'Failed to fetch forms', details: err.message });
  }
});

// Get single form with fields
app.get('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const form = await directusRequest('GET', `/items/forms/${id}`);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Get fields for this form
    const fields = await directusRequest('GET', `/items/form_fields?filter[form_id][_eq]=${id}&sort=position,id`);
    
    res.json({
      ...form,
      fields: fields || []
    });
  } catch (err) {
    console.error('Error fetching form:', err);
    res.status(500).json({ error: 'Failed to fetch form', details: err.message });
  }
});

// Create new form
app.post('/api/forms', async (req, res) => {
  try {
    const { title, status = 'draft', description = '' } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const form = await directusRequest('POST', '/items/forms', {
      title,
      status,
      description
    });
    
    res.status(201).json(form);
  } catch (err) {
    console.error('Error creating form:', err);
    res.status(500).json({ error: 'Failed to create form', details: err.message });
  }
});

// Update form
app.put('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status, description } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    
    const form = await directusRequest('PATCH', `/items/forms/${id}`, updateData);
    
    res.json(form);
  } catch (err) {
    console.error('Error updating form:', err);
    res.status(500).json({ error: 'Failed to update form', details: err.message });
  }
});

// Delete form
app.delete('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await directusRequest('DELETE', `/items/forms/${id}`);
    res.json({ message: 'Form deleted successfully' });
  } catch (err) {
    console.error('Error deleting form:', err);
    res.status(500).json({ error: 'Failed to delete form', details: err.message });
  }
});

// ============ FORM FIELDS API ============

// Get all fields for a form
app.get('/api/forms/:formId/fields', async (req, res) => {
  try {
    const { formId } = req.params;
    const fields = await directusRequest('GET', `/items/form_fields?filter[form_id][_eq]=${formId}&sort=position,id`);
    res.json(fields || []);
  } catch (err) {
    console.error('Error fetching fields:', err);
    res.status(500).json({ error: 'Failed to fetch fields', details: err.message });
  }
});

// Create new field
app.post('/api/forms/:formId/fields', async (req, res) => {
  try {
    const { formId } = req.params;
    const { 
      field_type, 
      field_name, 
      field_label, 
      is_required = false, 
      position = 0,
      field_options = null,
      description = null
    } = req.body;
    
    if (!field_type || !field_name) {
      return res.status(400).json({ error: 'field_type and field_name are required' });
    }
    
    // Get max position if not provided
    let finalPosition = position;
    if (position === 0) {
      const existingFields = await directusRequest('GET', `/items/form_fields?filter[form_id][_eq]=${formId}&sort=-position&limit=1`);
      finalPosition = existingFields && existingFields.length > 0 ? existingFields[0].position + 1 : 1;
    }
    
    const field = await directusRequest('POST', '/items/form_fields', {
      form_id: parseInt(formId),
      field_type,
      field_name,
      field_label,
      is_required,
      position: finalPosition,
      field_options: field_options || null,
      description
    });
    
    res.status(201).json(field);
  } catch (err) {
    console.error('Error creating field:', err);
    res.status(500).json({ error: 'Failed to create field', details: err.message });
  }
});

// Update field
app.put('/api/fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      field_type, 
      field_name, 
      field_label, 
      is_required, 
      position,
      field_options,
      description
    } = req.body;
    
    const updateData = {};
    if (field_type !== undefined) updateData.field_type = field_type;
    if (field_name !== undefined) updateData.field_name = field_name;
    if (field_label !== undefined) updateData.field_label = field_label;
    if (is_required !== undefined) updateData.is_required = is_required;
    if (position !== undefined) updateData.position = position;
    if (field_options !== undefined) updateData.field_options = field_options;
    if (description !== undefined) updateData.description = description;
    
    const field = await directusRequest('PATCH', `/items/form_fields/${id}`, updateData);
    
    res.json(field);
  } catch (err) {
    console.error('Error updating field:', err);
    res.status(500).json({ error: 'Failed to update field', details: err.message });
  }
});

// Delete field
app.delete('/api/fields/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await directusRequest('DELETE', `/items/form_fields/${id}`);
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error('Error deleting field:', err);
    res.status(500).json({ error: 'Failed to delete field', details: err.message });
  }
});

// Reorder fields
app.post('/api/forms/:formId/fields/reorder', async (req, res) => {
  try {
    const { fieldIds } = req.body;
    
    if (!Array.isArray(fieldIds)) {
      return res.status(400).json({ error: 'fieldIds must be an array' });
    }
    
    // Update each field position
    for (let i = 0; i < fieldIds.length; i++) {
      await directusRequest('PATCH', `/items/form_fields/${fieldIds[i]}`, {
        position: i + 1
      });
    }
    
    res.json({ message: 'Fields reordered successfully' });
  } catch (err) {
    console.error('Error reordering fields:', err);
    res.status(500).json({ error: 'Failed to reorder fields', details: err.message });
  }
});

// ============ EXPORT TO EXCEL ============

// Export form responses to Excel
app.get('/api/forms/:formId/export', async (req, res) => {
  try {
    const { formId } = req.params;
    
    // 1. Get form info
    const form = await directusRequest('GET', `/items/forms/${formId}`);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // 2. Get form fields sorted by position (for column order)
    const fields = await directusRequest('GET', `/items/form_fields?filter[form_id][_eq]=${formId}&sort=position,id`);
    if (!fields || fields.length === 0) {
      return res.status(400).json({ error: 'Form has no fields' });
    }
    
    // 3. Get all responses for this form
    const responses = await directusRequest('GET', `/items/responses?filter[form_id][_eq]=${formId}&sort=created_at`);
    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: 'No responses found for this form' });
    }
    
    // 4. Get all response_fields for these responses
    const responseIds = responses.map(r => r.id);
    const responseFields = await directusRequest('GET', `/items/response_fields?filter[response_id][_in]=${responseIds.join(',')}&limit=-1`);
    
    // Create a map for quick lookup: response_id -> { field_id -> value }
    const responseFieldsMap = {};
    if (responseFields) {
      for (const rf of responseFields) {
        if (!responseFieldsMap[rf.response_id]) {
          responseFieldsMap[rf.response_id] = {};
        }
        responseFieldsMap[rf.response_id][rf.field_id] = rf.value;
      }
    }
    
    // 5. Build Excel data
    // Header row: ID ответа, Дата, Респондент, [поля по position...]
    const headerRow = ['ID ответа', 'Дата', 'Респондент'];
    const fieldIdOrder = []; // to maintain field order
    
    for (const field of fields) {
      headerRow.push(field.field_label || field.field_name);
      fieldIdOrder.push(field.id);
    }
    
    // Data rows
    const dataRows = [headerRow];
    
    for (const response of responses) {
      const row = [
        response.id,
        response.created_at ? new Date(response.created_at).toLocaleString('ru-RU') : '',
        response.responder_id || ''
      ];
      
      const responseData = responseFieldsMap[response.id] || {};
      
      for (const fieldId of fieldIdOrder) {
        row.push(responseData[fieldId] || responseData[String(fieldId)] || '');
      }
      
      dataRows.push(row);
    }
    
    // 6. Create workbook
    const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
    
    // Set column widths
    const colWidths = headerRow.map((header, i) => {
      if (i < 3) return { wch: 20 }; // ID, Date, Responder
      return { wch: Math.max(15, String(header).length + 2) };
    });
    worksheet['!cols'] = colWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ответы');
    
    // 7. Generate buffer and send
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    const fileName = `${form.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_responses.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(buffer);
    
  } catch (err) {
    console.error('Error exporting to Excel:', err);
    res.status(500).json({ error: 'Failed to export', details: err.message });
  }
});

// Get responses count for a form
app.get('/api/forms/:formId/responses/count', async (req, res) => {
  try {
    const { formId } = req.params;
    const responses = await directusRequest('GET', `/items/responses?filter[form_id][_eq]=${formId}&aggregate[count]=id`);
    const count = responses?.[0]?.count?.id || 0;
    res.json({ count });
  } catch (err) {
    console.error('Error counting responses:', err);
    res.status(500).json({ error: 'Failed to count responses', details: err.message });
  }
});

// Health check / Config info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    directus_url: DIRECTUS_URL,
    token_configured: !!DIRECTUS_TOKEN
  });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Form Builder server running on http://localhost:${PORT}`);
  console.log(`Directus API: ${DIRECTUS_URL}`);
  console.log(`Token configured: ${DIRECTUS_TOKEN ? 'Yes' : 'No'}`);
});
