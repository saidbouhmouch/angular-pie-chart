import { AfterViewInit, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './data.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit , AfterViewInit {

  private data: any;
  private columns!: string[];
  private margin = { top: 10, right: 10, bottom: 10, left:5 };
  private width = 200;
  private height = 200;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.data = this.dataService.getData();
    this.columns = this.dataService.getColumns();
  }

  ngAfterViewInit():void{
    this.dataService.renderPieChart('#chart', this.data, this.columns, this.width, this.height,this.margin)
  }

}
