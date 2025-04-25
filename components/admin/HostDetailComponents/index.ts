import StatusBadge from './StatusBadge';
import StatusActionButton from './StatusActionButton';
import PhotoGallery from './PhotoGallery';
import AdditionalMedia from './AdditionalMedia';
import VideoPreview from './VideoPreview';
import { convertToCloudinaryResource, shouldShowButton } from './utils';

// 構建要導出的對象
const HostDetailComponents = {
  StatusBadge,
  StatusActionButton,
  PhotoGallery,
  AdditionalMedia,
  VideoPreview,
  convertToCloudinaryResource,
  shouldShowButton
};

export default HostDetailComponents;
