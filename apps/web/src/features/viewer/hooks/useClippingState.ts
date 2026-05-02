import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { toggleClipping, setClippingPlanes, toggleClippingInvert } from '@/store/viewerToolsSlice';

export function useClippingState() {
  const dispatch = useDispatch();
  const { enabled, planes, invert } = useSelector((state: RootState) => state.viewerTools.clipping);

  const handleToggleEnabled = () => {
    dispatch(toggleClipping());
  };

  const handlePlanesChange = (axis: 'x' | 'y' | 'z', value: string) => {
    dispatch(setClippingPlanes({
      ...planes,
      [axis]: parseFloat(value),
    }));
  };

  const handleToggleInvert = () => {
    dispatch(toggleClippingInvert());
  };

  return {
    enabled,
    planes,
    invert,
    handleToggleEnabled,
    handlePlanesChange,
    handleToggleInvert,
  };
}
