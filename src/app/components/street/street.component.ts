import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IntersectionState } from '../../enums/intersection-state';
import { LaneType } from '../../enums/lane-type';
import { StreetDirection } from '../../enums/street-direction';
import { IntersectionService } from '../../services/intersection.service';
import { LaneComponent } from '../lane/lane.component';
import { PedestrianButtonComponent } from '../pedestrian-button/pedestrian-button.component';
import { TrafficLightComponent } from '../traffic-light/traffic-light.component';

@Component({
  selector: 'app-street',
  standalone: true,
  imports: [LaneComponent, PedestrianButtonComponent, TrafficLightComponent, CommonModule],
  templateUrl: './street.component.html',
  styleUrl: './street.component.css'
})
export class StreetComponent implements OnInit, OnDestroy {
  @Input() direction!: StreetDirection;
  @Input() laneCount!: number;

  // Make enums into public params for html to use
  LaneType = LaneType;
  StreetDirection = StreetDirection;

  private streetDirectionCount = 0;

  intersectionStatus = IntersectionState.AllRed;
  isVertical = false;
  laneIds: number[] = [];
  stateSubscription: Subscription|undefined;
  currentState = IntersectionState.AllRed;

  constructor(private intersectionService: IntersectionService) {}

  ngOnInit() {
    this.streetDirectionCount = Object.keys(StreetDirection).length / 2;
    this.laneIds = Array.from(Array(this.laneCount).keys());
    this.isVertical = this.direction === StreetDirection.Up || this.direction === StreetDirection.Down;

    this.stateSubscription = this.intersectionService.$currentStateObs.subscribe((newState: IntersectionState) => {
      this.currentState = newState;
    });
  }

  ngOnDestroy() {
    this.stateSubscription?.unsubscribe();
  }

  public getIncomingLaneId(direction: StreetDirection, id: number): string {
    let dir = direction;

    if (id === 0) {
      dir = dir + 1 >= this.streetDirectionCount ? 0 : dir + 1;
    } else if (id === this.laneCount - 1) {
      dir = dir - 1 < 0 ? this.streetDirectionCount - 1 : dir - 1;
    }

    return `${dir}_${id}`;
  }
}
