import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { WorkareaCanvas } from './workarea-canvas';
import { VideoStudioService } from '../../../../shared/services/video-studio.service';
import { FontPickerService } from '../../../../shared/services/font-picker.service';

declare var $: any;

@Component({
  selector: 'app-vs-workarea-latest',
  templateUrl: './vs-workarea-latest.component.html',
  styleUrls: ['./vs-workarea-latest.component.scss']
})
export class VsWorkareaLatestComponent implements OnInit, OnDestroy {
  private canvas: WorkareaCanvas;
  private $uns: any = [];

  public props = {
    seek: {
      video: {
        seekRangeValue: [],
        totalSeconds: null,

        videoElement: null,
        currentTimeSliderElement: null,
        currentTimeBadgeElement: null,
        currentPlayTimeElement: null,
        uiSliderElementRect: null,
        isChangeCurentTimeSlider: false
      },
      image: {
        seekValue: null,
        seekMaxValue: null
      },
      width: null,
      previousDuration: null,
      isPlayingVideo: false
    },
    frame: null,
  };

  constructor(private vsService: VideoStudioService, private fsService: FontPickerService) {
  }

  ngOnInit() {
    this.canvas = new WorkareaCanvas(this.vsService, this.fsService);

    this.$uns.push(this.vsService.onChangeSceneRatio.subscribe((sceneRatio) => {
      this.changeSceneRatio(sceneRatio);
    }));

    this.$uns.push(this.vsService.onSelectFrame.subscribe((frame) => {
      this.changeFrame(frame);
    }));

    this.$uns.push(this.vsService.onEndFrameReposition.subscribe(() => {
      this.vsService.selectFrame(this.vsService.selected_frm_id);
    }));

    this.props.seek.video.currentTimeBadgeElement = document.getElementById('ui-current-time-badge');
    this.props.seek.video.currentTimeBadgeElement.innerHTML = '';
    this.props.seek.video.currentTimeBadgeElement.style.display = 'none';
  }

  ngOnDestroy() {
    this.canvas.destructor();
    this.$uns.forEach($uns => {
      $uns.unsubscribe();
    });
  }

  changeFrame(frame) {
    if (this.props.frame != null) {
      this.canvas.updateCanvas();
    }

    if (frame) {
      this.props.frame = frame;
      this.canvas.update(this.props.frame);
      this.drawFrame();

      if (this.props.frame.frm_type === 1) {    // if Video
        this.props.seek.video.totalSeconds = this.props.frame.frm_duration.duration;
        this.props.seek.video.seekRangeValue = [this.props.frame.frm_duration.seekTime * 10, this.props.frame.frm_duration.endTime * 10];
        this.props.seek.isPlayingVideo = false;

        setTimeout(() => {
          this.props.seek.video.videoElement = <HTMLMediaElement>document.getElementById('video-frame');

          const element = document.getElementById('video-seek-element').children.item(0);
          this.props.seek.video.uiSliderElementRect = element.getBoundingClientRect();

          if (document.getElementsByClassName('ui-slider-current-handle').length !== 0) {
            $('.ui-slider-current-handle').remove();
          }
          if (document.getElementsByClassName('ui-slider-current-time').length !== 0) {
            $('.ui-slider-current-time').remove();
          }
          this.props.seek.video.currentTimeSliderElement = document.createElement('span');
          this.props.seek.video.currentTimeSliderElement.className = 'ui-slider-current-handle';
          this.props.seek.video.currentTimeSliderElement.style.display = 'none';
          element.appendChild(this.props.seek.video.currentTimeSliderElement);

          this.props.seek.video.currentPlayTimeElement = document.createElement('span');
          this.props.seek.video.currentPlayTimeElement.className = 'ui-slider-current-time';
          this.props.seek.video.currentPlayTimeElement.style.display = 'none';
          element.appendChild(this.props.seek.video.currentPlayTimeElement);
        }, 50);

        this.props.seek.previousDuration = this.props.frame.frm_duration.endTime - this.props.frame.frm_duration.seekTime;
      } else {
        this.props.seek.image.seekValue = this.props.frame.frm_duration;
        this.props.seek.image.seekMaxValue = 30;

        this.props.seek.previousDuration = this.props.frame.frm_duration;
      }
    }
  }

  changeSceneRatio(sceneRatio) {
    if (this.props.frame) {
      this.props.frame = this.vsService.project.getFrame(this.props.frame.frm_id);
      this.canvas.updateSceneRatio();
      this.canvas.update(this.props.frame);
      this.drawFrame();
    }
  }

  drawFrame() {
    const size = this.canvas.getSize();
    $('#frame').width(size.width);
    $('#frame').height(size.height);
    if (this.props.frame && this.props.frame.frm_type === 1) {
      $('#video-frame').attr('src', this.props.frame.frm_path);
      const border = this.canvas.getBorder();
      const scale = this.canvas.getScale();
      $('#video-frame').css('left', (border.left + this.props.frame.frm_reposition.offsetX * scale) + 'px');
      $('#video-frame').css('top', (border.top + this.props.frame.frm_reposition.offsetY * scale) + 'px');
      $('#video-frame').width(this.props.frame.frm_reposition.width * scale);
      $('#video-frame').height(this.props.frame.frm_reposition.height * scale);
    }
    if (this.props.frame && this.props.frame.frm_type === 2) {
      $('#image-frame').attr('src', this.props.frame.frm_path);
      const border = this.canvas.getBorder();
      const scale = this.canvas.getScale();
      $('#image-frame').css('left', (border.left + this.props.frame.frm_reposition.offsetX * scale) + 'px');
      $('#image-frame').css('top', (border.top + this.props.frame.frm_reposition.offsetY * scale) + 'px');
      $('#image-frame').width(this.props.frame.frm_reposition.width * scale);
      $('#image-frame').height(this.props.frame.frm_reposition.height * scale);
    }
  }

  playPauseVideo() {
    if (this.props.seek.isPlayingVideo === true) {
      this.props.seek.video.videoElement.pause();
      this.props.seek.isPlayingVideo = false;
    } else {
      this.props.seek.video.videoElement.play();
      this.props.seek.isPlayingVideo = true;
      this.setCurrentPlayTimePosition(this.props.seek.video.videoElement.currentTime);
      this.showCurrentPlayTimeSlider();
    }
  }
  onTimeUpdate() {
    if (this.props.seek.video.isChangeCurentTimeSlider === false) {
      setTimeout(() => {
        this.setCurrentPlayTimePosition(this.props.seek.video.videoElement.currentTime);
      }, 50);
    }
  }

  showCurrentTimeSlider() {
    if (this.props.seek.video.currentTimeSliderElement) {
      this.props.seek.video.currentTimeSliderElement.style.display = 'block';
      this.props.seek.video.currentTimeBadgeElement.style.display = 'block';
    }
  }
  hideCurrentTimeSlider() {
    if (this.props.seek.video.currentTimeSliderElement) {
      this.props.seek.video.currentTimeSliderElement.style.display = 'none';
      this.props.seek.video.currentTimeBadgeElement.style.display = 'none';
    }
  }
  setCurrentTimeSliderOption(option) {
    this.props.seek.video.isChangeCurentTimeSlider = false;
    this.props.seek.video.currentTimeBadgeElement.style.display = 'none';
  }

  showCurrentPlayTimeSlider() {
    this.props.seek.video.currentPlayTimeElement.style.display = 'block';
  }
  hideCurrentPlayTimeSlider() {
    this.props.seek.video.currentPlayTimeElement.style.display = 'none';
  }
  setCurrentPlayTimePosition(currentTime) {
    let percent = currentTime / this.props.seek.video.totalSeconds;
    if (percent < 0) {
      percent = 0;
    } else if (percent > 1) {
      percent = 1;
      this.props.seek.isPlayingVideo = false;
    }
    this.props.seek.video.currentPlayTimeElement.style.left = (percent * 100) + '%';
  }

  changeCurrentTimeSlider($event) {
    this.hideCurrentPlayTimeSlider();

    this.props.seek.video.videoElement.pause();
    this.props.seek.isPlayingVideo = false;
    this.props.seek.video.isChangeCurentTimeSlider = true;

    const percent = (($event.clientX - this.props.seek.video.uiSliderElementRect.x) / this.props.seek.video.uiSliderElementRect.width);
    if (percent < 0 || percent > 1) {
      this.props.seek.video.currentTimeSliderElement.style.left = '0%';
      return;
    }
    const currentTime = percent * this.props.seek.video.totalSeconds;
    this.props.seek.video.videoElement.currentTime = currentTime;
    this.props.seek.video.currentTimeSliderElement.style.left = (percent * 100) + '%';

    // tslint:disable-next-line:max-line-length
    this.props.seek.video.currentTimeBadgeElement.style.top = (this.props.seek.video.currentTimeSliderElement.getBoundingClientRect().top - 30) + 'px';
    // tslint:disable-next-line:max-line-length
    this.props.seek.video.currentTimeBadgeElement.style.left = (this.props.seek.video.currentTimeSliderElement.getBoundingClientRect().left - 25) + 'px';
    this.props.seek.video.currentTimeBadgeElement.innerHTML = currentTime.toFixed(1) + 's';
  }
  changeVideoSeek() {
    const duration = {
      seekTime: this.props.seek.video.seekRangeValue[0] / 10,
      duration: this.props.frame.frm_duration.duration,
      endTime: this.props.seek.video.seekRangeValue[1] / 10
    };
    this.vsService.changeSeek(duration);
  }

  changeVideoDuration() {
    const duration = (this.props.seek.video.seekRangeValue[1] - this.props.seek.video.seekRangeValue[0]) / 10;
    const delta = duration - this.props.seek.previousDuration;

    if (delta !== 0) {
      this.props.seek.isPlayingVideo = false;
      this.props.seek.video.videoElement.pause();

      this.vsService.changeDuration(delta);

      this.props.seek.previousDuration = duration;
    }
  }

  timeFormat(time) {
    time /= 10;
    if (typeof time !== 'undefined') {
      let hours: any = Math.floor(time / 3600);
      hours = hours < 10 ? '0' + hours : hours;
      let minutes: any = Math.floor(time / 60);
      minutes = minutes < 10 ? '0' + minutes : minutes;
      let seconds: any = (time % 60).toFixed(2);
      seconds = seconds < 10 ? '0' + seconds : seconds;

      let output = '';
      output += hours + ':';
      output += minutes + ':';
      output += seconds;
      return (output);
    }

    return '';
  }

  changeImageDuration() {
    const delta = this.props.seek.image.seekValue - this.props.seek.previousDuration;
    if (delta !== 0) {
      this.props.seek.previousDuration = this.props.seek.image.seekValue;
      this.vsService.changeDuration(delta);
    }
  }

  changeImageSeek() {
    const duration = this.props.seek.image.seekValue;
    this.vsService.changeSeek(duration);
  }

  // Resize event interaction
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (this.props.frame) {
      this.canvas.update(this.props.frame);
      this.drawFrame();
    }

    const el = document.getElementById('video-seek-element');
    if (el) {
      const element = el.children.item(0);
      this.props.seek.video.uiSliderElementRect = element.getBoundingClientRect();
    }
  }
}
