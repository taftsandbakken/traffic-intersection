import { Component, Input } from '@angular/core';
import { StreetDirection } from '../../enums/street-direction';
import { StreetComponent } from '../street/street.component';

@Component({
  selector: 'app-intersection',
  standalone: true,
  imports: [StreetComponent],
  templateUrl: './intersection.component.html',
  styleUrl: './intersection.component.css'
})
export class IntersectionComponent {
  @Input() laneCount!: number;

  // Make enums into public params for html to use
  StreetDirection = StreetDirection;
}
