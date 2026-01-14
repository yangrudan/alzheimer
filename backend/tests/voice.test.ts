/**
 * Voice Integration Tests
 * 
 * NOTE: These tests require supertest to be installed.
 * Install with: npm install --save-dev supertest @types/supertest
 * 
 * To run tests: npm test
 */

import request from 'supertest';
import { app } from '../src/index';
import VoiceDevice from '../src/models/VoiceDevice';
import VoiceAudit from '../src/models/VoiceAudit';

describe('Voice Integration API', () => {
  describe('POST /api/voice/webhook', () => {
    it('should accept webhook without authentication when VOICE_API_TOKEN is not set', async () => {
      const response = await request(app)
        .post('/api/voice/webhook')
        .send({
          intent: 'query_reminders',
          deviceId: 'test-device-001',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    it('should reject webhook without intent field', async () => {
      const response = await request(app)
        .post('/api/voice/webhook')
        .send({
          deviceId: 'test-device-001',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('intent');
    });

    it('should handle confirm_medication intent', async () => {
      const response = await request(app)
        .post('/api/voice/webhook')
        .send({
          intent: 'confirm_medication',
          deviceId: 'test-device-001',
          userId: 'test-user-uuid',
          parameters: {
            medicationName: '阿司匹林',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeTruthy();
    });

    it('should handle query_reminders intent', async () => {
      const response = await request(app)
        .post('/api/voice/webhook')
        .send({
          intent: 'query_reminders',
          deviceId: 'test-device-001',
          userId: 'test-user-uuid',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('reminders');
    });

    it('should handle emergency_call intent', async () => {
      const response = await request(app)
        .post('/api/voice/webhook')
        .send({
          intent: 'emergency_call',
          deviceId: 'test-device-001',
          userId: 'test-user-uuid',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('emergency', true);
    });

    it('should reject unknown intent', async () => {
      const response = await request(app)
        .post('/api/voice/webhook')
        .send({
          intent: 'unknown_intent',
          deviceId: 'test-device-001',
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UNKNOWN_INTENT');
    });
  });

  describe('POST /api/voice/devices/register', () => {
    it('should register a new device', async () => {
      const response = await request(app)
        .post('/api/voice/devices/register')
        .send({
          deviceId: 'test-device-002',
          deviceType: 'xiaogpt',
          deviceName: '测试设备',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('deviceId', 'test-device-002');
    });

    it('should reject registration without required fields', async () => {
      const response = await request(app)
        .post('/api/voice/devices/register')
        .send({
          deviceId: 'test-device-003',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required fields');
    });
  });

  describe('GET /api/voice/devices/:deviceId', () => {
    it('should return 404 for non-existent device', async () => {
      const response = await request(app)
        .get('/api/voice/devices/non-existent-device')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/voice/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/voice/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('running');
    });
  });
});

describe('Voice Service', () => {
  // Additional unit tests for VoiceService can be added here
  // These would test the service methods directly without HTTP layer
});
