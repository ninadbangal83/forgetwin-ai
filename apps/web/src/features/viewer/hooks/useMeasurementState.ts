import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { clearMeasurements } from '@/store/viewerToolsSlice';

export function useMeasurementState() {
  const dispatch = useDispatch();
  const measurements = useSelector((state: RootState) => state.viewerTools.measurements);

  const handleClear = () => {
    dispatch(clearMeasurements());
  };

  return {
    measurements,
    handleClear,
  };
}
