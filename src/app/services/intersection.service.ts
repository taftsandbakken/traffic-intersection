import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { intersectionStateMap, IntersectionStateMapValue } from '../data/intersection-state-map';
import { IntersectionState } from '../enums/intersection-state';
import { SimulationState } from '../enums/simulation-state';
import { StreetDirection } from '../enums/street-direction';

@Injectable({
  providedIn: 'root'
})
export class IntersectionService {
  private readonly VERTICAL = 'Vertical';
  private readonly HORIZONTAL = 'Horizontal';
  private readonly TRIGGER_KEY = 'StraightGreen';
  private readonly CAR_LOOP_DURATION = 1000;
  private readonly TRAFFIC_LIGHTS_PER_SEQUENCE = 3;

  private readonly intersectionStateLoop: IntersectionState[] = [
    IntersectionState.AllRed,
    IntersectionState.VerticalStraightGreenWithBlinkingHorizontalYellow,
    IntersectionState.VerticalStraightYellow,
    IntersectionState.AllRed,
    IntersectionState.VerticalLeftTurnGreen,
    IntersectionState.VerticalLeftTurnYellow,
    IntersectionState.AllRed,
    IntersectionState.HorizontalStraightGreenWithBlinkingVerticalYellow,
    IntersectionState.HorizontalStraightYellow,
    IntersectionState.AllRed,
    IntersectionState.HorizontalLeftTurnGreen,
    IntersectionState.HorizontalLeftTurnYellow,
  ];

  private crosswalkTriggers: {[key: string]: boolean} = {
    'VerticalStraightGreen': false,
    'HorizontalStraightGreen': false
  };

  private leftTurnTriggers: {[key: string]: boolean} = {
    'Down': false,
    'Left': false,
    'Right': false,
    'Up': false
  };

  private simulationSource = new BehaviorSubject(SimulationState.Stopped);
  private stateSource = new BehaviorSubject(IntersectionState.AllRed);
  private outgoingCarSource = new BehaviorSubject('');
  private carLoopSource = new BehaviorSubject(null);
  private currentState = IntersectionState.AllRed;
  private currentStateLoopIndex = 0;
  private currentSimulationState = SimulationState.Stopped;
  private carLoopInterval: any = null;
  private stateTimeout: any = null;

  $currentSimulationStateObs = this.simulationSource.asObservable();
  $currentStateObs = this.stateSource.asObservable();
  $outgoingCarObs = this.outgoingCarSource.asObservable();
  $carLoopObs = this.carLoopSource.asObservable();

  constructor() { }

  public startSimulation(newState: SimulationState): SimulationState {
    this.currentStateLoopIndex = 0;
    this.currentSimulationState = newState;
    this.simulationSource.next(this.currentSimulationState);
    this.currentState = IntersectionState.AllRed;
    this.carLoopInterval = setInterval(() => this.carLoopSource.next(null), this.CAR_LOOP_DURATION);
    Object.keys(this.crosswalkTriggers).forEach(k => this.crosswalkTriggers[k] = false);
    this.updateStateLoop();
    return this.currentSimulationState;
  }

  public endSimulation(): SimulationState {
    this.currentSimulationState = SimulationState.Stopped;
    this.simulationSource.next(this.currentSimulationState);
    clearInterval(this.carLoopInterval);
    clearTimeout(this.stateTimeout);
    return SimulationState.Stopped;
  }

  public updateStateLoop(): void {
    if (this.currentSimulationState === SimulationState.Stopped)
      return;

    this.updateCurrentState();
    this.stateSource.next(this.currentState);
    const currentStateDuration = intersectionStateMap[IntersectionState[this.currentState]].duration;
    this.stateTimeout = setTimeout(() => this.updateStateLoop(), currentStateDuration);
  }

  public crosswalkClicked(direction: StreetDirection): void {
    const triggerPrefix = direction === StreetDirection.Up || direction === StreetDirection.Down ?
      this.HORIZONTAL : this.VERTICAL;
    this.crosswalkTriggers[`${triggerPrefix}${this.TRIGGER_KEY}`] = true;
  }

  public carWentThroughIntersection(direction: StreetDirection, id: number): void {
    this.outgoingCarSource.next(`${direction}_${id}`);
  }

  public updateIsCarWaitingInTurnLaneStatus(direction: StreetDirection, isCarWaiting: boolean): void {
    this.leftTurnTriggers[StreetDirection[direction]] = isCarWaiting;
  }

  private updateCurrentState(): void {
    this.incrementCurrentState(1);

    let intersectionStateMapValue = intersectionStateMap[IntersectionState[this.currentState]];
    intersectionStateMapValue = this.checkForLeftTurnTriggers(intersectionStateMapValue);
    this.checkForCrosswalkTriggers(intersectionStateMapValue);
  }

  private incrementCurrentState(numOfSteps: number): void {
    this.currentStateLoopIndex += numOfSteps;
    this.checkIfStateLoopRestarts();
    this.currentState = this.intersectionStateLoop[this.currentStateLoopIndex];
  }

  private checkIfStateLoopRestarts(): void {
    if (this.currentStateLoopIndex >= this.intersectionStateLoop.length)
      this.currentStateLoopIndex = this.currentStateLoopIndex % this.intersectionStateLoop.length;
  }

  // Check if the current light supports any pressed crosswalk buttons
  private checkForCrosswalkTriggers(intersectionStateMapValue: IntersectionStateMapValue): void {
    if (!this.checkForAllCrosswalkTrigger(intersectionStateMapValue)) {
      if (intersectionStateMapValue.checkForCrosswalkTrigger &&
      this.crosswalkTriggers[IntersectionState[intersectionStateMapValue.checkForCrosswalkTrigger]]) {
        this.resetCrosswalkTrigger(IntersectionState[intersectionStateMapValue.checkForCrosswalkTrigger]);
        this.currentState = intersectionStateMapValue.checkForCrosswalkTrigger;
      }
    }
  }

  private checkForAllCrosswalkTrigger(intersectionStateMapValue: IntersectionStateMapValue): boolean {
    if (intersectionStateMapValue.checkForCrosswalkTrigger === IntersectionState.AllRedForCrosswalks && this.areAllCrosswalkTriggersOn()) {
        this.currentState = IntersectionState.AllRedForCrosswalks;
        this.resetCrosswalkTrigger(null);
        return true;
    }
    return false;
  }

  private areAllCrosswalkTriggersOn(): boolean {
    return Object.values(this.crosswalkTriggers).every(trigger => trigger);
  }

  private resetCrosswalkTrigger(trigger: string|null): void {
    if (trigger == null)
      Object.keys(this.crosswalkTriggers).forEach(t => this.crosswalkTriggers[t] = false);
    else
      this.crosswalkTriggers[trigger] = false;
  }

  private checkForLeftTurnTriggers(intersectionStateMapValue: IntersectionStateMapValue): IntersectionStateMapValue {
    if (intersectionStateMapValue.checkForLeftTurnTriggers &&
      !intersectionStateMapValue.checkForLeftTurnTriggers.some(trigger => this.leftTurnTriggers[StreetDirection[trigger]]
    )) {
      this.incrementCurrentState(this.TRAFFIC_LIGHTS_PER_SEQUENCE);
      intersectionStateMapValue = intersectionStateMap[IntersectionState[this.currentState]];
    }
    return intersectionStateMapValue;
  }
}
