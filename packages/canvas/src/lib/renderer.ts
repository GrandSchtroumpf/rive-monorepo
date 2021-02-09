// WIP: Attempt of migrating Rendere.js to TS

function makeMatrix(m2d) {
  const m = new DOMMatrix();
  m.a = m2d.xx;
  m.b = m2d.xy;
  m.c = m2d.yx;
  m.d = m2d.yy;
  m.e = m2d.tx;
  m.f = m2d.ty;
  return m;
}

function colorStyle(value: number) {
  return (
    'rgba(' +
    ((0x00ff0000 & value) >>> 16) +
    ',' +
    ((0x0000ff00 & value) >>> 8) +
    ',' +
    ((0x000000ff & value) >>> 0) +
    ',' +
    ((0xff000000 & value) >>> 24) / 0xff +
    ')'
  );
}

const {
  RenderPaintStyle,
  FillRule,
  RenderPath,
  RenderPaint,
  Renderer,
  StrokeCap,
  StrokeJoin,
  BlendMode,
} = Module;

const { fill, stroke } = RenderPaintStyle;

const { evenOdd, nonZero } = FillRule;

export class CanvasRenderPath extends RenderPath {
  private _path2D = new Path2D();
  private _fillRule: any;

  reset() {
    this._path2D = new Path2D();
  }
  addPath(path, m2d) {
    this._path2D.addPath(path._path2D, makeMatrix(m2d));
  }
  fillRule(fillRule) {
    this._fillRule = fillRule;
  }
  moveTo(x: number, y: number) {
    this._path2D.moveTo(x, y);
  }
  lineTo(x: number, y: number) {
    this._path2D.lineTo(x, y);
  }
  cubicTo(
    ox: number,
    oy: number,
    ix: number,
    iy: number,
    x: number,
    y: number
  ) {
    this._path2D.bezierCurveTo(ox, oy, ix, iy, x, y);
  }
  close() {
    this._path2D.closePath();
  }
}

type Join = 'miter' | 'round' | 'bevel';
type Cap = 'butt' | 'round' | 'square';
type Blend = 'source-over' | 'screen'; // TO complete
interface Gradient {
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  stops: { color: number; stop: number }[];
  isRadial?: boolean;
}

export class CanvasRenderPaint extends RenderPaint {
  private _value: string | CanvasGradient;
  private _thickness: any;
  private _join: Join;
  private _cap: Cap;
  private _style: any;
  private _blend: Blend;
  private _gradient: Gradient;

  color(value: number) {
    this._value = colorStyle(value);
  }
  thickness(value) {
    this._thickness = value;
  }
  join(value: Join) {
    if (value in StrokeJoin) {
      this._join = StrokeJoin[value];
    }
  }
  cap(value: Cap) {
    if (value in StrokeCap) {
      this._cap = StrokeCap[value];
    }
  }
  style(value) {
    this._style = value;
  }
  blendMode(value) {
    switch (value) {
      case BlendMode.srcOver:
        this._blend = 'source-over';
        break;
      case BlendMode.screen:
        this._blend = 'screen';
        break;
      case BlendMode.overlay:
        this._blend = 'overlay';
        break;
      case BlendMode.darken:
        this._blend = 'darken';
        break;
      case BlendMode.lighten:
        this._blend = 'lighten';
        break;
      case BlendMode.colorDodge:
        this._blend = 'color-dodge';
        break;
      case BlendMode.colorBurn:
        this._blend = 'color-burn';
        break;
      case BlendMode.hardLight:
        this._blend = 'hard-light';
        break;
      case BlendMode.softLight:
        this._blend = 'soft-light';
        break;
      case BlendMode.difference:
        this._blend = 'difference';
        break;
      case BlendMode.exclusion:
        this._blend = 'exclusion';
        break;
      case BlendMode.multiply:
        this._blend = 'multiply';
        break;
      case BlendMode.hue:
        this._blend = 'hue';
        break;
      case BlendMode.saturation:
        this._blend = 'saturation';
        break;
      case BlendMode.color:
        this._blend = 'color';
        break;
      case BlendMode.luminosity:
        this._blend = 'luminosity';
        break;
    }
  }
  linearGradient(sx: number, sy: number, ex: number, ey: number) {
    this._gradient = {
      sx,
      sy,
      ex,
      ey,
      stops: [],
    };
  }
  radialGradient(sx: number, sy: number, ex: number, ey: number) {
    this._gradient = {
      sx,
      sy,
      ex,
      ey,
      stops: [],
      isRadial: true,
    };
  }
  addStop(color: number, stop: number) {
    this._gradient.stops.push({
      color,
      stop,
    });
  }

  completeGradient() {}

  draw(ctx: CanvasRenderingContext2D, path) {
    let { _style, _value, _gradient, _blend } = this;

    ctx.globalCompositeOperation = _blend;

    if (_gradient != null) {
      const { sx, sy, ex, ey, stops, isRadial } = _gradient;

      if (isRadial) {
        const dx = ex - sx;
        const dy = ey - sy;
        const radius = Math.sqrt(dx * dx + dy * dy);
        _value = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
      } else {
        _value = ctx.createLinearGradient(sx, sy, ex, ey);
      }

      for (const { stop, color } of stops) {
        _value.addColorStop(stop, colorStyle(color));
      }
      this._value = _value;
      this._gradient = null;
    }
    switch (_style) {
      case stroke:
        ctx.strokeStyle = _value;
        ctx.lineWidth = this._thickness;
        ctx.lineCap = this._cap;
        ctx.lineJoin = this._join;
        ctx.stroke(path._path2D);
        break;
      case fill:
        ctx.fillStyle = _value;
        ctx.fill(path._path2D);
        break;
    }
  }
}

export class CanvasRenderer extends Renderer {
  constructor(private _ctx: CanvasRenderingContext2D) {
    super();
  }
  save() {
    this._ctx.save();
  }
  restore() {
    this._ctx.restore();
  }
  transform(matrix) {
    this._ctx.transform(
      matrix.xx,
      matrix.xy,
      matrix.yx,
      matrix.yy,
      matrix.tx,
      matrix.ty
    );
  }
  drawPath(path, paint) {
    paint.draw(this._ctx, path);
  }
  clipPath(path) {
    this._ctx.clip(
      path._path2D,
      path._fillRule === evenOdd ? 'evenodd' : 'nonzero'
    );
  }
}

export const renderFactory = {
  makeRenderPaint() {
    return new CanvasRenderPaint();
  },
  makeRenderPath() {
    return new CanvasRenderPath();
  },
};
