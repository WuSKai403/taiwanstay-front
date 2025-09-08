import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// 建立一個 Vision API 客戶端
const client = new ImageAnnotatorClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { gcsUri } = req.body;

  if (!gcsUri) {
    return res.status(400).json({ message: 'Missing GCS URI in request body.' });
  }

  try {
    const [result] = await client.safeSearchDetection(gcsUri);
    const safeSearch = result.safeSearchAnnotation;

    if (!safeSearch) {
      return res.status(500).json({ message: 'Vision API did not return safe search results.' });
    }

    const isLikelyAdult =
      safeSearch.adult === 'VERY_LIKELY';

    const status = isLikelyAdult ? 'Rejected' : 'Approved';

    res.status(200).json({
      status: status,
      safeSearch: safeSearch,
      message: `圖片狀態已自動判定為 ${status}.`
    });
  } catch (error) {
    console.error('Vision API 偵測失敗:', error);
    res.status(500).json({ message: 'Vision API 偵測失敗', error: (error as Error).message });
  }
}