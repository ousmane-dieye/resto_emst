export const validateBody = (schema) => (req, res, next) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    
    if (rules.required && !value) {
      errors.push({ field, message: `${field} est requis` });
      continue;
    }
    
    if (rules.type && value && typeof value !== rules.type) {
      errors.push({ field, message: `${field} doit être de type ${rules.type}` });
    }
    
    if (rules.minLength && value && value.length < rules.minLength) {
      errors.push({ field, message: `${field} doit contenir au moins ${rules.minLength} caractères` });
    }
    
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors.push({ field, message: rules.message || `${field} invalide` });
    }
    
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({ field, message: `${field} doit être une des valeurs: ${rules.enum.join(', ')}` });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation échouée', details: errors, code: 'VALIDATION_ERROR' });
  }
  
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = req.query[field];
    
    if (rules.required && !value) {
      errors.push({ field, message: `${field} est requis` });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation échouée', details: errors, code: 'VALIDATION_ERROR' });
  }
  
  next();
};