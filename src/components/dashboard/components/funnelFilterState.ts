import { ALL_MONTHS_VALUE, ALL_QUARTERS_VALUE } from '../utils/funnelFilters';

export interface FunnelFilterState {
  selectedFunnelMonth: string;
  selectedQuarter: string;
}

export const applyFunnelMonthChange = (
  state: FunnelFilterState,
  month: string,
): FunnelFilterState => ({
  selectedFunnelMonth: month,
  selectedQuarter: month === ALL_MONTHS_VALUE ? state.selectedQuarter : ALL_QUARTERS_VALUE,
});

export const applyFunnelQuarterChange = (
  state: FunnelFilterState,
  quarter: string,
): FunnelFilterState => ({
  selectedFunnelMonth: quarter === ALL_QUARTERS_VALUE ? state.selectedFunnelMonth : ALL_MONTHS_VALUE,
  selectedQuarter: quarter,
});
