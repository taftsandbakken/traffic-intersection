import { Component, OnDestroy, OnInit } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import { Subscription } from 'rxjs';
import { IntersectionState } from '../../enums/intersection-state';
import { SimulationState } from '../../enums/simulation-state';
import { IntersectionService } from '../../services/intersection.service';
import { IntersectionComponent } from '../intersection/intersection.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatToolbarModule, IntersectionComponent, MatButtonModule, MatButtonToggleModule, MatTooltipModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Make enums into public params for html to use
  SimulationState = SimulationState;

  readonly SIMULATION_MODE_AUTO_VALUE = 'auto';
  readonly SIMULATION_MODE_MANUAL_VALUE = 'manual';
  readonly LANE_COUNT = 4

  simulationState = SimulationState.Stopped;
  simulationMode = this.SIMULATION_MODE_AUTO_VALUE;
  stateLog: string[] = [];
  showLog = false;

  private stateSubscription: Subscription|undefined;

  constructor(private intersectionService: IntersectionService) {}

  ngOnInit() {
    this.stateSubscription = this.intersectionService.$currentStateObs.subscribe((newState: IntersectionState) => {
      this.stateLog.push(IntersectionState[newState]);
    });
  }

  ngOnDestroy() {
    this.stateSubscription?.unsubscribe();
  }

  startSimulation(newState: SimulationState): void {
    this.stateLog = [];
    this.simulationState = this.intersectionService.startSimulation(newState);
  }

  endSimulation(): void {
    this.simulationState = this.intersectionService.endSimulation();
  }
}
