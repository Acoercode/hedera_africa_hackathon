const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const hederaService = require('../services/hederaService');

// GET /api/patients - Get all patients
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { isActive: true };
    
    if (status) {
      query.consentStatus = status;
    }

    const patients = await Patient.find(query)
      .select('-dataEncryptionKey -accessLog')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /api/patients/:id - Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ 
      patientId: req.params.id, 
      isActive: true 
    }).select('-dataEncryptionKey');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// GET /api/patients/hedera/:accountId - Get patient by Hedera account ID
router.get('/hedera/:accountId', async (req, res) => {
  try {
    const patient = await Patient.findByHederaAccount(req.params.accountId)
      .select('-dataEncryptionKey');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient by Hedera account:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// GET /api/patients/wallet/:address - Get patient by wallet address
router.get('/wallet/:address', async (req, res) => {
  try {
    const patient = await Patient.findByWalletAddress(req.params.address)
      .select('-dataEncryptionKey');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient by wallet address:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// POST /api/patients - Create new patient
router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      hederaAccountId,
      walletAddress,
      medicalHistory = []
    } = req.body;

    // Validate required fields
    if (!patientId || !firstName || !lastName || !dateOfBirth || !gender || !email || !hederaAccountId || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({
      $or: [
        { patientId },
        { email },
        { hederaAccountId },
        { walletAddress }
      ]
    });

    if (existingPatient) {
      return res.status(409).json({ error: 'Patient already exists' });
    }

    // Generate encryption key
    const dataEncryptionKey = require('crypto').randomBytes(32).toString('hex');

    // Create new patient
    const patient = new Patient({
      patientId,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      email,
      phone,
      medicalHistory,
      hederaAccountId,
      walletAddress,
      dataEncryptionKey,
      consentStatus: 'pending'
    });

    await patient.save();

    // Remove sensitive data from response
    const patientResponse = patient.toObject();
    delete patientResponse.dataEncryptionKey;
    delete patientResponse.accessLog;

    res.status(201).json(patientResponse);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// PUT /api/patients/:id - Update patient
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ 
      patientId: req.params.id, 
      isActive: true 
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'medicalHistory'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(patient, updates);
    await patient.save();

    // Remove sensitive data from response
    const patientResponse = patient.toObject();
    delete patientResponse.dataEncryptionKey;
    delete patientResponse.accessLog;

    res.json(patientResponse);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// PUT /api/patients/:id/consent - Update patient consent
router.put('/:id/consent', async (req, res) => {
  try {
    const { status, transactionId } = req.body;

    if (!status || !transactionId) {
      return res.status(400).json({ error: 'Missing status or transactionId' });
    }

    const patient = await Patient.findOne({ 
      patientId: req.params.id, 
      isActive: true 
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update consent status
    await patient.updateConsent(status, transactionId);

    // Add access log
    await patient.addAccessLog(
      'consent_update',
      'system',
      'consent_status_change',
      transactionId
    );

    // Remove sensitive data from response
    const patientResponse = patient.toObject();
    delete patientResponse.dataEncryptionKey;
    delete patientResponse.accessLog;

    res.json(patientResponse);
  } catch (error) {
    console.error('Error updating patient consent:', error);
    res.status(500).json({ error: 'Failed to update patient consent' });
  }
});

// GET /api/patients/:id/access-log - Get patient access log
router.get('/:id/access-log', async (req, res) => {
  try {
    const patient = await Patient.findOne({ 
      patientId: req.params.id, 
      isActive: true 
    }).select('accessLog');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ accessLog: patient.accessLog });
  } catch (error) {
    console.error('Error fetching patient access log:', error);
    res.status(500).json({ error: 'Failed to fetch access log' });
  }
});

// DELETE /api/patients/:id - Soft delete patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ 
      patientId: req.params.id, 
      isActive: true 
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Soft delete
    patient.isActive = false;
    await patient.save();

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;