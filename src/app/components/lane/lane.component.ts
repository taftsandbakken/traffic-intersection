import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { IntersectionState } from '../../enums/intersection-state';
import { SimulationState } from '../../enums/simulation-state';
import { LaneType } from '../../enums/lane-type';
import { StreetDirection } from '../../enums/street-direction';
import { IntersectionService } from '../../services/intersection.service';

type CarLine = Array<string | null>;
type OutgoingCar = {incomingLaneId: string, carColor: string};

@Component({
  selector: 'app-lane',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './lane.component.html',
  styleUrl: './lane.component.css'
})
export class LaneComponent implements OnDestroy {
  @Input() direction!: StreetDirection;
  @Input() type!: LaneType;
  @Input() id!: number;
  @Input() laneCount!: number;
  @Input() currentState!: IntersectionState;
  @Input() incomingLaneId: string|undefined;

  // Make enums into public params for html to use
  LaneType = LaneType;
  StreetDirection = StreetDirection;

  //percentage chances out of 100
  private readonly CHANCE_OF_INCOMING_CAR_LEFT_LANE = 10;
  private readonly CHANCE_OF_INCOMING_CAR_RIGHT_LANE = 20;
  private readonly CHANCE_OF_INCOMING_CAR_STRAIGHT_LANE = 50;
  private readonly MIDDLE_OF_INTERSECTION_DURATION = 100;
  private readonly CAR_ASSET_FOLDER = 'assets/cars/';
  private readonly LEFT_TURN_LANE_ID = 0;
  private readonly CARS_PER_LINE = 4;
  private readonly CAR_COLORS = [
    'red-car',
    'blue-car',
    'yellow-car',
    'white-car'
  ];

  private chanceOfIncomingCarForCurrentLane = 0;
  private isVertical = false;

  currentSimulationState = SimulationState.Stopped;
  simulationSubscription: Subscription|undefined;
  outgoingSubscription: Subscription|undefined;
  carLoopSubscription: Subscription|undefined;
  incomingCarLine: CarLine = Array(this.CARS_PER_LINE).fill(null);
  outgoingCarLine: CarLine = Array(this.CARS_PER_LINE).fill(null);

  constructor(private intersectionService: IntersectionService) {}

  ngOnInit() {
    this.isVertical = this.direction === StreetDirection.Up || this.direction === StreetDirection.Down;

    this.chanceOfIncomingCarForCurrentLane = this.id === this.LEFT_TURN_LANE_ID
      ? this.CHANCE_OF_INCOMING_CAR_LEFT_LANE
      : this.id === this.laneCount - 1
        ? this.CHANCE_OF_INCOMING_CAR_RIGHT_LANE
        : this.CHANCE_OF_INCOMING_CAR_STRAIGHT_LANE;

    this.setupObservables();
  }

  ngOnDestroy() {
    this.simulationSubscription?.unsubscribe();
    this.outgoingSubscription?.unsubscribe();
    this.carLoopSubscription?.unsubscribe();
  }

  laneClick(): void {
    if (this.type === LaneType.Outgoing)
      return;
    this.incomingCarLine[this.LEFT_TURN_LANE_ID] = this.getRandCarColor();
  }

  getCarSrc(carColor: string|null): string {
    if (carColor)
      return this.CAR_ASSET_FOLDER + carColor + '.png';
    return '';
  }

  private setupCarLines(): void {
    this.incomingCarLine = Array(this.CARS_PER_LINE).fill(null);
    this.outgoingCarLine = Array(this.CARS_PER_LINE).fill(null);
  }

  private setupObservables(): void {
    this.simulationSubscription = this.intersectionService.$currentSimulationStateObs.subscribe((newSimulationState: SimulationState) => {
      this.simulationStateUpdated(newSimulationState);
    });

    this.carLoopSubscription = this.intersectionService.$carLoopObs.subscribe(() => {
      this.updateCarLoop();
    });

    this.setupOutgoingObservable();
  }

  private simulationStateUpdated(newSimulationState: SimulationState): void {
    this.currentSimulationState = newSimulationState;
      if (newSimulationState !== SimulationState.Stopped) {
        this.setupCarLines();
      }
  }

  private setupOutgoingObservable() {
    if (this.type === LaneType.Outgoing) {
      this.outgoingSubscription = this.intersectionService.$outgoingCarObs.subscribe((outgoingCar: OutgoingCar) => {
        setTimeout(() => {
          if (this.incomingLaneId === outgoingCar.incomingLaneId)
            this.outgoingCarLine[this.LEFT_TURN_LANE_ID] = outgoingCar.carColor;
        }, this.MIDDLE_OF_INTERSECTION_DURATION);
      });
    }
  }

  private updateCarLoop(): void {
    if (this.currentSimulationState === SimulationState.Stopped)
      return;

    if (this.type === LaneType.Incoming)
      this.addIncomingCars();
    else
      this.removeOutgoingCars();
  }

  private addIncomingCars(): void {
    this.moveCarsForward(this.incomingCarLine, this.isIncomingLaneLightGreen());

    if (this.currentSimulationState === SimulationState.RunningAuto &&
      this.chanceOfIncomingCarForCurrentLane > Math.floor(Math.random() * 100)) {
      this.incomingCarLine[this.LEFT_TURN_LANE_ID] = this.getRandCarColor();
    }
  }

  private removeOutgoingCars(): void {
    this.moveCarsForward(this.outgoingCarLine);
  }

  private moveCarsForward(carLine: CarLine, canExitLane = true): void {
    for (let i = carLine.length - 1; i >= 0; i--) {
      this.tryToMoveCarForward(carLine, i, canExitLane);
      this.checkIfCarCameFromBehind(carLine, i);
    }
    if (this.id === this.LEFT_TURN_LANE_ID && this.type === LaneType.Incoming) {
      this.intersectionService.updateIsCarWaitingInTurnLaneStatus(this.direction, carLine[this.CARS_PER_LINE - 1] != null);
    }
  }

  private tryToMoveCarForward(carLine: CarLine, i: number, canExitLane: boolean): void {
    if (this.isNextLaneSpaceOpen(carLine, i, canExitLane)) {
      this.checkIfCarWentThroughIntersection(carLine, i);
      carLine[i] = null;
    }
  }

  private checkIfCarCameFromBehind(carLine: CarLine, i: number): void {
    if (i > 0 && carLine[i - 1]) {
      const carBehind = carLine[i - 1];
      if (carLine[i] == null) {
        carLine[i - 1] = null;
        carLine[i] = carBehind;
      }
    }
  }

  private checkIfCarWentThroughIntersection(carLine: CarLine, i: number) {
    if (carLine[i] && i === carLine.length - 1 && this.type === LaneType.Incoming)
      this.intersectionService.carWentThroughIntersection(this.direction, this.id, carLine[i]!);
  }

  private isIncomingLaneLightGreen(): boolean {
    if (this.isVertical)
      return this.isIncomingVerticalLaneLightGreen();

    return this.isIncomingHorizontalLaneLightGreen();
  }

  private isNextLaneSpaceOpen(carLine: CarLine, i: number, canExitLane: boolean): boolean {
    return canExitLane || (i < carLine.length - 1 && carLine[i + 1] === null);
  }

  private isIncomingVerticalLaneLightGreen(): boolean {
    if (this.id === this.LEFT_TURN_LANE_ID) {
      return this.currentState === IntersectionState.VerticalLeftTurnGreen || this.currentState === IntersectionState.VerticalLeftTurnYellow;
    }
    return this.currentState === IntersectionState.VerticalStraightGreen ||
      this.currentState === IntersectionState.VerticalStraightGreenWithBlinkingHorizontalYellow ||
      this.currentState === IntersectionState.VerticalStraightYellow;
  }

  private isIncomingHorizontalLaneLightGreen(): boolean {
    if (this.id === this.LEFT_TURN_LANE_ID) {
      return this.currentState === IntersectionState.HorizontalLeftTurnGreen || this.currentState === IntersectionState.HorizontalLeftTurnYellow;
    }
    return this.currentState === IntersectionState.HorizontalStraightGreen ||
      this.currentState === IntersectionState.HorizontalStraightGreenWithBlinkingVerticalYellow ||
      this.currentState === IntersectionState.HorizontalStraightYellow;
  }

  private getRandCarColor(): string {
    return this.CAR_COLORS[Math.floor(Math.random() * this.CAR_COLORS.length)];
  }
}
