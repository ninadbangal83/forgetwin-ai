import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setExplodeFactor } from '@/store/viewerToolsSlice';

export function useExplodeState() {
  const dispatch = useDispatch();
  const factor = useSelector((state: RootState) => state.viewerTools.explodeFactor);

  const handleFactorChange = (value: string) => {
    dispatch(setExplodeFactor(parseFloat(value)));
  };

  return {
    factor,
    handleFactorChange,
  };
}
