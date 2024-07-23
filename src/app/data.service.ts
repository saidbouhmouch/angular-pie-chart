import { Injectable } from '@angular/core';
declare const d3: any;

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor() { }

  getData() {
    return {
      "question": "Was good at explaining things",
      "N/A": 0.02763018065887354,
      "Disagree": 0.10839532412327312,
      "Neither Agree nor Disagree": 0.13177470775770456,
      "Agree": 0.7321997874601488
    };
  }

  getColumns() {
    return ["N/A", "Disagree", "Neither Agree nor Disagree", "Agree"];
  }

  getTransformation(transform: string) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttributeNS(null, "transform", transform);
    const matrix = g.transform.baseVal.consolidate()?.matrix;

    if (!matrix) {
      return { translateX: 0, translateY: 0, rotate: 0, skewX: 0, scaleX: 1, scaleY: 1 };
    }

    let { a, b, c, d, e, f } = matrix;
    let scaleX, scaleY, skewX;

    if ((scaleX = Math.sqrt(a * a + b * b))) {
      a /= scaleX;
      b /= scaleX;
    }

    if ((skewX = a * c + b * d)) {
      c -= a * skewX;
      d -= b * skewX;
    }

    if ((scaleY = Math.sqrt(c * c + d * d))) {
      c /= scaleY;
      d /= scaleY;
      skewX /= scaleY;
    }

    if (a * d < b * c) {
      a = -a;
      b = -b;
      skewX = -skewX;
      scaleX = -scaleX;
    }

    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * (180 / Math.PI),
      skewX: Math.atan(skewX) * (180 / Math.PI),
      scaleX,
      scaleY
    };
  }

  arrangeLabels(selection: any, label_class: string): void {
    let move = 1;
    while (move > 0) {
      move = 0;
      selection.selectAll(label_class)
        .each((d: any, i: any, nodes: any) => {
          const that = nodes[i];
          const a = that.getBoundingClientRect();
          selection.selectAll(label_class)
            .each((d: any, i: any, nodes: any) => {
              if (nodes[i] !== that) {
                const b = nodes[i].getBoundingClientRect();
                if ((Math.abs(a.left - b.left) * 2 < (a.width + b.width)) && (Math.abs(a.top - b.top) * 2 < (a.height + b.height))) {
                  const dx = (Math.max(0, a.right - b.left) + Math.min(0, a.left - b.right)) * 0.01;
                  const dy = (Math.max(0, a.bottom - b.top) + Math.min(0, a.top - b.bottom)) * 0.02;
                  const tt = this.getTransformation(d3.select(nodes[i]).attr("transform"));
                  const to = this.getTransformation(d3.select(that).attr("transform"));
                  move += Math.abs(dx) + Math.abs(dy);

                  to.translateX += dx;
                  to.translateY += dy;
                  tt.translateX -= dx;
                  tt.translateY -= dy;

                  d3.select(nodes[i]).attr("transform", `translate(${tt.translateX},${tt.translateY})`);
                  d3.select(that).attr("transform", `translate(${to.translateX},${to.translateY})`);
                }
              }
            });
        });
    }
  }

  wrapText(text: any, width: number): void {
    text.each((_: any, i: any, nodes: any) => {
      const textNode = d3.select(nodes[i]);
      const words = textNode.text().split(/\s+/).reverse();
      let word;
      const line: string[] = [];
      const lineHeight = 1;
      const y = 0;
      const x = 0;
      const dx = parseFloat(textNode.attr("dx")) || 0;
      let tspan = textNode.text(null)
        .append("tspan")
        .attr("x", x)
        .attr("y", y);

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node()!.getComputedTextLength() > width - x) {
          line.pop();
          tspan.text(line.join(" "));
          line.length = 0;
          line.push(word);
          tspan = textNode.append("tspan")
            .attr("x", x)
            .attr("dy", `${lineHeight}em`)
            .attr("dx", `${dx}em`)
            .text(word);
        }
      }
    });
  }

  pieChart(_width:number,_height:number,_margin:any): any {
    let width = _width;
    let height = _height
    const margin = _margin

    let columns: string[] = [];
    const fontSize = "0.7rem"

    const pformat = d3.format('.1%');
    const colourScale = d3.scaleOrdinal()
      .domain(["Meals", "Advertising", "Logistics Transport", "Assets"])
      .range(["#F0506D", "#9F8FDC", "#4ABEED", "#FFC107"]);

    const pie = d3.pie().sort(null).value((d: any) => d.value);
    const key = (d: any) => d.data.key;
    const midAngle = (d: any) => d.startAngle + (d.endAngle - d.startAngle) / 2;

    const chart = (selection: any) => {
      selection.each((data: any) => {
        let svg = d3.select(selection.node())
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        width -= margin.left + margin.right;
        height -= margin.top + margin.bottom;

        svg = svg.append("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);

        svg.append("g").attr("class", "slices");
        svg.append("g").attr("class", "labels");
        svg.append("g").attr("class", "lines");

        const pie_data: any[] = [];
        columns.forEach((c: string) => {
          if (+data[c] > 0) {
            pie_data.push({ key: c, value: +data[c] });
          }
        });

        const radius = Math.min(width, height) / 2;

        const arc = d3.arc()
          .outerRadius(radius * 0.6)
          .innerRadius(radius * 0.4)
          .padAngle(.02)
          .padRadius(100)
          .cornerRadius(2);

        const labelArc = d3.arc()
          .outerRadius(radius * 0.4)
          .innerRadius(radius);

        const slice = svg.select(".slices")
          .selectAll("path.slice")
          .data(pie(pie_data), key);

        slice.enter()
          .insert("path")
          .attr("d", arc)
          .attr("class", "slice")
          .style("stroke", "black")
          .style("stroke-width", "0.5px")
          .style("fill", (d: any) => colourScale(d.data.key));

        const text = svg.select(".labels")
          .selectAll("text")
          .data(pie(pie_data), key);

        text.enter()
          .append("text")
          .attr('class', 'label')
          .attr('id', (d: any, j: any) => 'l-' + j)
          .attr("transform", (d: any) => {
            const pos = labelArc.centroid(d);
            pos[0] = radius * (midAngle(d) < Math.PI ? 0.67 : -0.7);
            return `translate(${pos})`;
          })
          .style("text-anchor", (d: any) => midAngle(d) < Math.PI ? "start" : "end")
          .attr("dy", ".35em")
          .attr("dx", ".35em")
          .attr("fill", "#111")
          .style("font-size", fontSize)
          .text((d: any) => pformat(d.data.value))
          .call(this.wrapText, margin.right * 4);

        this.arrangeLabels(svg, ".label");

        const polyline = svg.select(".lines")
          .selectAll("polyline")
          .data(pie(pie_data), key);

        polyline.enter()
          .append("polyline")
          .attr("points", (d: any, j: number) => {
            const offset = midAngle(d) < Math.PI ? -2 : 10;
            const label = d3.select('#l-' + j);
            const transform = this.getTransformation(label.attr("transform"));
            const pos = labelArc.centroid(d);
            pos[0] = transform.translateX + offset;
            pos[1] = transform.translateY;
            const mid = labelArc.centroid(d);
            mid[1] = transform.translateY;
            return [arc.centroid(d), mid, pos];
          });
      });
    };

    chart.margin = function (_: any) {
      if (!arguments.length) return margin;
      margin.top = _.top !== undefined ? _.top : margin.top;
      margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
      margin.left = _.left !== undefined ? _.left : margin.left;
      margin.right = _.right !== undefined ? _.right : margin.right;
      return chart;
    };

    chart.width = function (_: any) {
      if (!arguments.length) return width;
      width = _;
      return chart;
    };

    chart.height = function (_: any) {
      if (!arguments.length) return height;
      height = _;
      return chart;
    };

    chart.columns = function (_: any) {
      if (!arguments.length) return columns;
      columns = _;
      return chart;
    };

    return chart;
  }

  renderPieChart(element:any,data:any,columns:string[],width:number,height:number,margin:any):void{
    const chart = this.pieChart(width,height,margin)
    .width(width)
    .height(height)
    .margin(margin)
    .columns(columns);

     d3.select(element).datum(data).call(chart);
  }

}
