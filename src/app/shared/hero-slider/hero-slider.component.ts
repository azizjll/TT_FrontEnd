import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-slider',
  standalone: false,
  templateUrl: './hero-slider.component.html',
  styleUrls: ['./hero-slider.component.scss']
})
export class HeroSliderComponent implements OnInit, OnDestroy {
  
  slides = [
    { image: 'assets/slides/slide1.jpg', alt: 'Promo Pass Roaming Omra' },
    { image: 'assets/slides/slide2.jpg', alt: 'Fibre TT WiFi Mesh' },
    { image: 'assets/slides/slide3.jpg', alt: 'Big Bonus 500%' },
  ];

  currentIndex = 0;
  private interval: any;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  startAutoPlay(): void {
    this.interval = setInterval(() => this.next(), 4000);
  }

  prev(): void {
    clearInterval(this.interval);
    this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.startAutoPlay();
  }

  next(): void {
    clearInterval(this.interval);
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.startAutoPlay();
  }

  goTo(index: number): void {
    clearInterval(this.interval);
    this.currentIndex = index;
    this.startAutoPlay();
  }
}