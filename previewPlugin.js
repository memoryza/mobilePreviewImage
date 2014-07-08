/**
  *插件主要利用scale translate来处理
  *author:memoryza(jincai.wang@foxmail.com)
**/
function previewPlugin(s) {
	this.initStatus(s);//初始化状态
	this.initUI();//绘制UI
	this.repaintUI();//重绘布局	
	this.bindEvent();//绑定事件
}
previewPlugin.prototype = {
	initStatus: function(s) {
		this.imgList = s.imgList;
		this.container = document.getElementById(s.id);
		this.headerTpl = s.headerTpl === null ? '' : '<img class="return" src="t_ico.png" width="24" height="24"/>';
		this.footerTpl = s.footerTpl === null ? '' : '';
		this.scaleHeight = s.scaleHeight;
		this.indexId = 0;
		this.imageLen = s.imgList.length;
		this.browserKit = ['-moz-', '', '-webkit-','-o-', '-ms-'];
	},
  initUI: function() {
		var self = this;
		var containerDom = document.createDocumentFragment();

		var header = document.createElement('div');
		header.setAttribute('class', 'header');
		header.innerHTML = this.headerTpl;
		containerDom.appendChild(header);

		var content = document.createElement('div');
		content.setAttribute('class', 'content');
		var contentHtml = '<ul>';
		for(var i  = 0, _len = this.imgList.length; i < _len ; i++) {
			var tsStr = '';
			for(var j =0 , _transLens = this.browserKit.length; j < _transLens; j++ ) {
				tsStr += this.browserKit[j] + 'transform:translate3d(' + i * window.innerWidth + 'px, 0,0);';
			}
			if(i != 0) {
				tsStr += 'display:none;';
			}
			contentHtml += '<li style="position:absolute;' + tsStr + ';width:' + window.innerWidth+'px;"><img src="' + this.imgList[i] + '" /></li>'
		}
		contentHtml += '</ul>'
		content.innerHTML = contentHtml;
		containerDom.appendChild(content);

		var footer = document.createElement('div');
		footer.setAttribute('class', 'footer');
		footer.innerHTML = this.footerTpl;
		containerDom.appendChild(footer);

		this.container.appendChild(containerDom);
	},
  repaintUI: function() {
		var self = this;
		var imgs =  self.container.getElementsByClassName('content')[0].getElementsByTagName('img');
		for(var i = 0, _len = imgs.length; i < _len ; i++) {
			(function(targetImg) {
				var img = new Image();
				img.onload = function(e) {
				 	if(img.complete) {
				 		//先不考虑转屏幕			 		
				 		var scale = this.width / window.innerWidth;//缩放因子
				 		if(this.width > this.height) {
				 			//计算 宽图
				 			targetImg.setAttribute('scale', scale);
				 			if(this.width > window.innerWidth) {
				 				targetImg.style.width = window.innerWidth + 'px';
				 				targetImg.style.height = this.height / scale + 'px';
				 			}
				 		} else {
				 			//长图需要计算
				 			var scale = this.height / self.scaleHeight;//缩放因子
				 			targetImg.setAttribute('scale', scale);
				 			if(this.height >  self.scaleHeight) {
				 				targetImg.style.width = this.width / scale + 'px';
				 				targetImg.style.height = self.scaleHeight + 'px';
				 			}
				 		}
				 	}
				 }
				img.src = targetImg.src;
			}(imgs[i]));
		}
	},
	bindEvent: function() {	
		var self = this;
		if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
		    Hammer.plugins.showTouches();
		}
		if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
			Hammer.plugins.fakeMultitouch();
		}

		var hammertime = Hammer(self.container, {
			preventDefault		: true,
			transformMinScale   : 1,
			dragBlockHorizontal : true,
			dragBlockVertical   : true,
			dragMinDistance     : 0
		});
		
		var posX = 0, posY = 0, scale = 1, last_scale = 1, lastPosX =0 , lastPosY = 0;
		var rect = self.container.getElementsByClassName('content')[0];
		hammertime.on('touch touchend drag transform', function(ev) {
			switch(ev.type) {
				case 'touch':
					last_scale = scale;
					break;
				case 'drag':
					posX = lastPosX + ev.gesture.deltaX;
					if(scale != 1) {					
						posY = lastPosY + ev.gesture.deltaY;
						var currentImg = self.container.getElementsByClassName('content')[0].getElementsByTagName('img')[self.indexId];
						var realWidth = parseFloat(currentImg.style.width);
						var realHeight = parseFloat(currentImg.style.height);
						var skewingWidth = (window.innerWidth * scale - window.innerWidth)/2;//实际移动差值
						var skewingHeight = (self.scaleHeight * scale - self.scaleHeight)/2;
						var realSkewingWidth = (realWidth * scale - window.innerWidth)/2 > 0 ? (realWidth * scale - window.innerWidth)/2 : 0;//fixed实际图高宽小于展现图框的大小，出现负值的情况
						var realSkewingHeight = (realHeight * scale - self.scaleHeight)/2 > 0 ? (realHeight * scale - self.scaleHeight)/2 : 0;
						
						if(skewingWidth >  realSkewingWidth) {
							skewingWidth = realSkewingWidth;
						}
						if(skewingHeight >  realSkewingHeight) {
							skewingHeight = realSkewingHeight;
						}
						//缩放的时候左右拖动有边界
						if(posX < -skewingWidth) {
							lastPosX = posX = -skewingWidth;					
						} else if(posX > skewingWidth) {
							lastPosX = posX = skewingWidth;
						}

						if(posY < -skewingHeight) {
							lastPosY = posY = -skewingHeight;			
						} else if(posY > skewingHeight) {
							lastPosY = posY = skewingHeight;	
						}					
					}
					break;
				case 'transform':
					scale = Math.min(last_scale * ev.gesture.scale, 10);
					var imgScale = parseFloat(self.container.getElementsByClassName('content')[0].getElementsByTagName('img')[self.indexId].getAttribute('scale'));
					scale = scale > imgScale ? imgScale : scale;
					//坐标跟着缩放动态变化
					if(scale < last_scale) {
						posX = posX * scale / last_scale;
						posY = posY * scale / last_scale;
					}
					
					break;
				case 'touchend':						
					lastPosX = posX;
					lastPosY = posY;
					if(last_scale == 1 && scale == 1 && Math.abs(posX) > window.innerWidth/5) {
						self.swap(posX > 0 ? 'swiperight' : 'swipeleft');
						//情况各种状态
						lastPosX = lastPosY = posX = posY = 0;
					}

					//fixed 高图或宽图在预览高宽乘以缩放因子以后比实际高度还打的问题
					var currentImg = self.container.getElementsByClassName('content')[0].getElementsByTagName('img')[self.indexId];
					var realWidth = parseFloat(currentImg.style.width);
					var realHeight = parseFloat(currentImg.style.height);
					var skewingWidth = (window.innerWidth * scale - window.innerWidth)/2;
					var skewingHeight = (self.scaleHeight * scale - self.scaleHeight)/2;
					var realSkewingWidth = (realWidth * scale - window.innerWidth)/2 > 0 ? (realWidth * scale - window.innerWidth)/2 : 0;//fixed实际图高宽小于展现图框的大小，出现负值的情况
					var realSkewingHeight = (realHeight * scale - self.scaleHeight)/2 > 0 ? (realHeight * scale - self.scaleHeight)/2 : 0;
				
					if(skewingWidth >  realSkewingWidth) {
						skewingWidth = realSkewingWidth;
					}
					if(skewingHeight >  realSkewingHeight) {
						skewingHeight = realSkewingHeight;
					}
					
					//缩放的时候左右拖动有边界
					if(posX < -skewingWidth) {
						lastPosX = posX = -skewingWidth;					
					} else if(posX > skewingWidth) {
						lastPosX = posX = skewingWidth;
					}

					if(posY < -skewingHeight) {
						lastPosY = posY = -skewingHeight;			
					} else if(posY > skewingHeight) {
						lastPosY = posY = skewingHeight;	
					}
					//微调整当缩放比过低就自动还原为1
					if(scale <= 1) {
						lastPosX = lastPosY = posX = posY = 0;
					}
					scale = scale < 1 ? 1 :scale;
					break;
			}
			var transform = "translate3d(" + posX + "px," + posY + "px, 0) " + "scale3d(" + scale + "," + scale + ", 1) ";
			rect.style.transform = transform;
			rect.style.oTransform = transform;
			rect.style.msTransform = transform;
			rect.style.mozTransform = transform;
			rect.style.webkitTransform = transform;
		});
	},
	//左右切换
	swap: function(direction) {
		if(direction == 'swipeleft') {
			this.go(1);
		} else if(direction == 'swiperight') {
			this.go(-1);
		}
	},
	getIndexId: function() {
		this.indexId =  (this.indexId + this.imageLen) % this.imageLen;
	},
	go: function(direction) {
		var self = this, dom = null, transform;	

		self.indexId = self.indexId + direction;
		self.getIndexId();	
			
		for(var i = 0; i < this.imageLen;  i++) {
			transform = "translate3d(" + (i - self.indexId) * window.innerWidth + "px, 0px, 0) " + "scale3d(1, 1, 1) ";
			dom = self.container.getElementsByTagName('li')[i];
			if(dom) {
				(function(oDom, transform, j) {
					oDom.style.transform = transform;
					oDom.style.oTransform = transform;
					oDom.style.msTransform = transform;
					oDom.style.webkitTransform = transform;
					if(j == self.indexId) {
						oDom.style.display = 'block';
					} else {
						oDom.style.display = 'none';
					}
				})(dom, transform, i);		
			}
		}	
	},
	destory: function() {
		this.indexId = 0;	
		this.container.innerHTML = '';
	}
}