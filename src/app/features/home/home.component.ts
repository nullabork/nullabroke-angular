import { Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  ngOnInit() {
    this.title.setTitle('Nullabroke - Search SEC Filings Like a Pro');
    this.meta.updateTag({ name: 'description', content: 'Search, explore, and analyze SEC filings with powerful query-driven workflows. Built for analysts, researchers, and anyone who needs fast access to EDGAR data.' });
  }
}
