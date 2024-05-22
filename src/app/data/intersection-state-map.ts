import { IntersectionState } from "../enums/intersection-state";
import { StreetDirection } from "../enums/street-direction";

export interface IntersectionStateMapValue {
  duration: number,
  checkForCrosswalkTrigger?: IntersectionState,
  checkForLeftTurnTriggers?: StreetDirection[]
}

export interface IntersectionStateMap {
  [key: string]: IntersectionStateMapValue
}

const GREEN_STRAIGHT_DURATION_DEFAULT = 4000;
const GREEN_TURN_DURATION_DEFAULT = 3000;
const YELLOW_DURATION_DEFAULT = 1000;
const RED_DURATION_DEFAULT = 1000;
const CROSSWALK_DURATION_DEFAULT = 3000;

export const intersectionStateMap: IntersectionStateMap = {
  'AllRed': {
    duration: RED_DURATION_DEFAULT,
    checkForCrosswalkTrigger: IntersectionState.AllRedForCrosswalks
  },
  'AllRedForCrosswalks': {
    duration: CROSSWALK_DURATION_DEFAULT
  },
  'VerticalStraightGreenWithBlinkingHorizontalYellow': {
    duration: GREEN_STRAIGHT_DURATION_DEFAULT,
    checkForCrosswalkTrigger: IntersectionState.VerticalStraightGreen
  },
  'VerticalStraightGreen': {
    duration: GREEN_STRAIGHT_DURATION_DEFAULT
  },
  'VerticalStraightYellow': {
    duration: YELLOW_DURATION_DEFAULT
  },
  'VerticalLeftTurnGreen': {
    duration: GREEN_TURN_DURATION_DEFAULT,
    checkForLeftTurnTriggers: [StreetDirection.Down, StreetDirection.Up]
  },
  'VerticalLeftTurnYellow': {
    duration: YELLOW_DURATION_DEFAULT
  },
  'HorizontalStraightGreenWithBlinkingVerticalYellow': {
    duration: GREEN_STRAIGHT_DURATION_DEFAULT,
    checkForCrosswalkTrigger: IntersectionState.HorizontalStraightGreen
  },
  'HorizontalStraightGreen': {
    duration: GREEN_STRAIGHT_DURATION_DEFAULT
  },
  'HorizontalStraightYellow': {
    duration: YELLOW_DURATION_DEFAULT
  },
  'HorizontalLeftTurnGreen': {
    duration: GREEN_TURN_DURATION_DEFAULT,
    checkForLeftTurnTriggers: [StreetDirection.Left, StreetDirection.Right]
  },
  'HorizontalLeftTurnYellow': {
    duration: YELLOW_DURATION_DEFAULT
  }
};
