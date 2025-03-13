import { createMocks } from 'node-mocks-http';
import searchHandler from '../../../pages/api/opportunities/search';
import { OpportunityType } from '../../../models/enums';

describe('Search API', () => {
  it('應該返回所有機會當沒有提供搜索參數時', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();
    expect(Array.isArray(data.opportunities)).toBe(true);
    expect(data.opportunities.length).toBeGreaterThan(0);
  });

  it('應該根據關鍵詞過濾機會', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        q: '農場',
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會都包含關鍵詞
    data.opportunities.forEach((opp: any) => {
      const containsKeyword =
        opp.title.includes('農場') ||
        opp.description.includes('農場') ||
        opp.hostName.includes('農場') ||
        opp.location.address.includes('農場');

      expect(containsKeyword).toBe(true);
    });
  });

  it('應該根據機會類型過濾機會', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        type: OpportunityType.FARMING,
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會都是農業類型
    data.opportunities.forEach((opp: any) => {
      expect(opp.type).toBe(OpportunityType.FARMING);
    });
  });

  it('應該根據工作時數範圍過濾機會', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        minHours: '20',
        maxHours: '25',
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會的工作時數都在範圍內
    data.opportunities.forEach((opp: any) => {
      expect(opp.workHours).toBeGreaterThanOrEqual(20);
      expect(opp.workHours).toBeLessThanOrEqual(25);
    });
  });

  it('應該根據地區過濾機會', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        region: '北部',
      },
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.opportunities).toBeDefined();

    // 驗證所有返回的機會都在北部地區
    data.opportunities.forEach((opp: any) => {
      expect(opp.location.region).toBe('北部');
    });
  });

  it('應該返回405錯誤當使用不允許的HTTP方法時', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await searchHandler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.message).toBe('方法不允許');
  });
});