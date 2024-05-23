import { Component, Input, OnInit } from '@angular/core';
import { horizontalStateToAssetMap, verticalStateToAssetMap } from '../../data/state-to-asset-maps';
import { IntersectionState } from '../../enums/intersection-state';
import { StreetDirection } from '../../enums/street-direction';

@Component({
  selector: 'app-traffic-light',
  standalone: true,
  imports: [],
  templateUrl: './traffic-light.component.html',
  styleUrl: './traffic-light.component.css'
})
export class TrafficLightComponent implements OnInit {
  @Input() currentState!: IntersectionState;
  @Input() direction!: StreetDirection;

  // Make enums into public params for html to use
  IntersectionState = IntersectionState;

  readonly ASSETS_HOME = 'assets/lights/';

  currentStateKey = '';
  stateToAssetMap: Record<string, {
    standard: string,
    leftTurn: string
  }> = {};

  ngOnInit() {
    const isVertical = this.direction === StreetDirection.Up || this.direction === StreetDirection.Down;
    this.stateToAssetMap = isVertical ? verticalStateToAssetMap : horizontalStateToAssetMap;
  }
}
