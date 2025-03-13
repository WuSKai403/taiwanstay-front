import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapComponent from '../../../components/MapComponent';

// 模擬Leaflet
jest.mock('leaflet', () => {
  const originalModule = jest.requireActual('leaflet');

  // 創建模擬的地圖實例
  const mockMap = {
    setView: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    eachLayer: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  };

  // 創建模擬的標記實例
  const mockMarker = {
    addTo: jest.fn().mockReturnThis(),
    bindPopup: jest.fn().mockReturnThis(),
    openPopup: jest.fn().mockReturnThis(),
  };

  return {
    ...originalModule,
    map: jest.fn().mockImplementation(() => mockMap),
    tileLayer: jest.fn().mockImplementation(() => ({
      addTo: jest.fn().mockReturnThis(),
    })),
    marker: jest.fn().mockImplementation(() => mockMarker),
    Map: jest.fn().mockImplementation(() => mockMap),
  };
});

// 模擬Leaflet CSS
jest.mock('leaflet/dist/leaflet.css', () => ({}));

describe('MapComponent', () => {
  beforeEach(() => {
    // 清除所有模擬的調用記錄
    jest.clearAllMocks();
  });

  it('應該正確渲染地圖容器', () => {
    const { container } = render(
      <MapComponent
        position={[25.0330, 121.5654]}
        title="台北101"
        zoom={15}
      />
    );

    // 檢查地圖容器是否存在
    const mapContainer = container.firstChild;
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveClass('h-full');
    expect(mapContainer).toHaveClass('w-full');
  });

  it('應該在位置或標題變更時更新地圖', () => {
    const { container, rerender } = render(
      <MapComponent
        position={[25.0330, 121.5654]}
        title="台北101"
        zoom={15}
      />
    );

    // 使用不同的位置和標題重新渲染
    rerender(
      <MapComponent
        position={[22.6273, 120.3014]}
        title="高雄85大樓"
        zoom={15}
      />
    );

    // 檢查地圖容器是否仍然存在
    const mapContainer = container.firstChild;
    expect(mapContainer).toBeInTheDocument();
  });
});