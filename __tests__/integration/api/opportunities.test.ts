import { createMocks } from 'node-mocks-http';
import opportunitiesHandler from '../../../pages/api/opportunities/index';
import opportunityHandler from '../../../pages/api/opportunities/[id]';
import searchHandler from '../../../pages/api/opportunities/search';
import { OpportunityStatus, OpportunityType, WorkType } from '../../../models/enums';

// 定義機會類型接口
interface Opportunity {
  id: string;
  title: string;
  description: string;
  workHours: number;
  type: OpportunityType;
  workType: WorkType;
  status: OpportunityStatus;
  location: {
    address: string;
    city: string;
    region: string;
    coordinates: [number, number];
  };
  [key: string]: any; // 允許其他屬性
}

describe('Opportunities API', () => {
  describe('GET /api/opportunities', () => {
    it('should return a list of opportunities', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunities).toBeDefined();
      expect(Array.isArray(data.opportunities)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('should filter opportunities by query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          type: OpportunityType.HOSPITALITY,
          region: '北部',
        },
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunities).toBeDefined();

      // 驗證篩選結果
      data.opportunities.forEach((opp: Opportunity) => {
        expect(opp.type).toBe(OpportunityType.HOSPITALITY);
        expect(opp.location.region).toBe('北部');
      });
    });
  });

  describe('GET /api/opportunities/[id]', () => {
    it('should return a single opportunity by ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: 'opp-001',
        },
      });

      await opportunityHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunity).toBeDefined();
      expect(data.opportunity.id).toBe('opp-001');
    });

    it('should return 404 for non-existent opportunity', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          id: 'non-existent-id',
        },
      });

      await opportunityHandler(req, res);

      expect(res._getStatusCode()).toBe(404);
    });
  });

  describe('POST /api/opportunities', () => {
    it('should create a new opportunity', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          title: '測試工作機會',
          description: '這是一個測試工作機會',
          workHours: 20,
          accommodation: '提供獨立單人房',
          benefits: ['免費WiFi', '可使用公共設施'],
          requirements: ['基本英語溝通能力'],
          startDate: '2023-06-01',
          endDate: '2023-09-30',
          location: {
            address: '測試地址',
            city: '台北市',
            region: '北部',
            coordinates: [121.5654, 25.0330]
          },
          type: OpportunityType.HOSPITALITY,
          workType: WorkType.RECEPTION
        },
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(201);

      const data = JSON.parse(res._getData());
      expect(data.message).toBe('工作機會創建成功');
      expect(data.opportunity).toBeDefined();
      expect(data.opportunity.title).toBe('測試工作機會');
    });

    it('should return 400 for missing required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // 缺少必填字段
          title: '測試工作機會',
        },
      });

      await opportunitiesHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  describe('GET /api/opportunities/search', () => {
    it('should search opportunities with advanced filters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          q: '農場',
          minHours: '20',
          maxHours: '30',
          sort: 'newest',
        },
      });

      await searchHandler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.opportunities).toBeDefined();
      expect(data.filters).toBeDefined();

      // 驗證篩選結果
      data.opportunities.forEach((opp: Opportunity) => {
        expect(opp.workHours).toBeGreaterThanOrEqual(20);
        expect(opp.workHours).toBeLessThanOrEqual(30);
      });
    });
  });
});