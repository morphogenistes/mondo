class Filter {
  constructor(dimension) {
    this.dimension = dimension;
    this.alpha = 0;
    this.prevY = new Array(dimension).fill(0);
  }

  process(newPoint) {
    const filteredOutput = [ ...newPoint ];
    for (let i = 0; i < this.dimension; ++i) {
      filteredOutput[i] *= 1 - this.alpha;
      filteredOutput[i] += this.prevY[i] * this.alpha;
    }
    this.prevY = [ ... filteredOutput ];
    return filteredOutput;
  }

  setAlpha(a) {
    this.alpha = a;
  }
};

export default Filter;