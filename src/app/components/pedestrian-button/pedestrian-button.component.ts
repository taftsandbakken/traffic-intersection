import { Component, Input, OnInit } from '@angular/core';
import { IntersectionState } from '../../enums/intersection-state';
import { LaneType } from '../../enums/lane-type';
import { StreetDirection } from '../../enums/street-direction';
import { IntersectionService } from '../../services/intersection.service';

@Component({
  selector: 'app-pedestrian-button',
  standalone: true,
  imports: [],
  templateUrl: './pedestrian-button.component.html',
  styleUrl: './pedestrian-button.component.css'
})
export class PedestrianButtonComponent implements OnInit {
  @Input() direction!: StreetDirection;
  @Input() type!: LaneType;
  @Input() currentState!: IntersectionState;

  readonly ASSETS_HOME = 'assets/';

  leftSrcSuffix = '';

  private isVertical = false;

  constructor(private intersectionService: IntersectionService) {}

  ngOnInit() {
    this.isVertical = this.direction === StreetDirection.Up || this.direction === StreetDirection.Down;
    if (this.type === LaneType.Incoming)
      this.leftSrcSuffix = '-left';
  }

  buttonClick() {
    this.intersectionService.crosswalkClicked(this.direction);
  }

  showBlinkingButton(): boolean {
    return this.currentState === IntersectionState.AllRedForCrosswalks ||
      (this.currentState === IntersectionState.HorizontalStraightGreen && this.isVertical) ||
      (this.currentState === IntersectionState.VerticalStraightGreen && !this.isVertical);
  }
}
