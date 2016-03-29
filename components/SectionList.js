'use strict';

var React = require('react-native');
var {Component, PropTypes, StyleSheet, View, Text, NativeModules} = React;
var UIManager = NativeModules.UIManager;

var noop = () => {};
var returnTrue = () => true;

class SectionList extends Component {

  constructor(props, context) {
    super(props, context);

    this.onSectionSelect = this.onSectionSelect.bind(this);
    this.resetSection = this.resetSection.bind(this);
    this.detectAndScrollToSection = this.detectAndScrollToSection.bind(this);
    this.lastSelectedIndex = null;
    this.state = {
      justifyContent: 'center',
    }
  }

  onSectionSelect(sectionId, fromTouch) {
    this.props.onSectionSelect && this.props.onSectionSelect(sectionId);

    if (!fromTouch) {
      this.lastSelectedIndex = null;
    }
  }

  resetSection() {
    this.lastSelectedIndex = null;
  }

  detectAndScrollToSection(e) {
    var ev = e.nativeEvent.touches[0];
    //var rect = {width:1, height:1, x: ev.locationX, y: ev.locationY};
    //var rect = [ev.locationX, ev.locationY];

    //UIManager.measureViewsInRect(rect, e.target, noop, (frames) => {
    //  if (frames.length) {
    //    var index = frames[0].index;
    //    if (this.lastSelectedIndex !== index) {
    //      this.lastSelectedIndex = index;
    //      this.onSectionSelect(this.props.sections[index], true);
    //    }
    //  }
    //});
    //UIManager.findSubviewIn(e.target, rect, viewTag => {
      //this.onSectionSelect(view, true);
    //})
    let targetY = ev.pageY;
    const { y, height } = this.measure;
    if(!y || targetY < y){
      return;
    }
    let index = Math.floor((targetY - y) / height);
    index = Math.min(index, this.props.sections.length - 1);
    if (this.lastSelectedIndex !== index && this.props.data[this.props.sections[index]].length) {
      this.lastSelectedIndex = index;
      this.onSectionSelect(this.props.sections[index], true);
    }
  }

  componentDidMount() {
    this.onMeasure();
    //console.log(sectionItem);
  }

  measureViews(views) {
    const p = views.map((v) => {
      return new Promise((resolve) => {
        this.measureView(v).then(resolve);
      });
    });
    return Promise.all(p);
  }

  measureView(view) {
    const measure = new Promise((resolve) => {
      setTimeout(() => {
        view.measure((x, y, width, height, pageX, pageY) => {
          resolve({ x, y, width, height, pageX, pageY });
        });
      }, 0);
    });
    const measureLayout = new Promise((resolve) => {
      if (view === this.refs.view) {
        resolve({ x: 0, y: 0 });
        return;
      }
      setTimeout(() => {
        view.measureLayout(React.findNodeHandle(this.refs.view), (x, y) => {
          resolve({ x, y });
        });
      }, 0);
    });
    return new Promise((resolve) => {
      Promise.all([ measure, measureLayout ]).then((v) => {
        resolve({ ...v[0], x: v[1].x, y: v[1].y });
      });
    });
  }

  onMeasure() {
    if (this && this.refs) {
      this.measureViews([ this.refs.view, this.refs.sectionItem0 ])
        .then((layouts) => {
          const view = layouts[0];
          const sectionItem0 = layouts[1];

          const isTopHidden =
            sectionItem0.height * this.props.sections.length > view.height;

          let pageY = sectionItem0.pageY;
          if (isTopHidden) {
            pageY = -sectionItem0.y + pageY;
            this.setState({
              justifyContent: "flex-start",
            });
          } else {
            this.setState({
              justifyContent: "center",
            });
          }
          this.measure = {
            y: pageY,
            height: sectionItem0.height
          };
        });
    }
  }

  componentWillUnmount() {
    this.measureTimer && clearTimeout(this.measureTimer);
  }

  render() {
    var SectionComponent = this.props.component;
    var sections = this.props.sections.map((section, index) => {
      var title = this.props.getSectionListTitle ?
        this.props.getSectionListTitle(section) :
        section;

      var textStyle = this.props.data[section].length ?
        styles.text :
        styles.inactivetext;

      var child = SectionComponent ?
        <SectionComponent
          sectionId={section}
          title={title}
        /> :
        <View
          style={styles.item}>
          <Text style={textStyle}>{title}</Text>
        </View>;

      //if(index){
        return (
          <View key={index} ref={'sectionItem' + index} pointerEvents="none">
            {child}
          </View>
        );
      //}
      //else{
      //  return (
      //    <View key={index} ref={'sectionItem' + index} pointerEvents="none"
      //          onLayout={e => {console.log(e.nativeEvent.layout)}}>
      //      {child}
      //    </View>
      //  );
      //
      //}
    });
    return (
      <View ref="view" style={[styles.container, {justifyContent: this.state.justifyContent}, this.props.style]}
        onStartShouldSetResponder={returnTrue}
        onMoveShouldSetResponder={returnTrue}
        onResponderGrant={this.detectAndScrollToSection}
        onResponderMove={this.detectAndScrollToSection}
        onResponderRelease={this.resetSection}
        onLayout={()=>{this.onMeasure()}}
      >
        {sections}
      </View>
    );
  }
}

SectionList.propTypes = {

  /**
   * A component to render for each section item
   */
  component: PropTypes.func,

  /**
   * Function to provide a title the section list items.
   */
  getSectionListTitle: PropTypes.func,

  /**
   * Function to be called upon selecting a section list item
   */
  onSectionSelect: PropTypes.func,

  /**
   * The sections to render
   */
  sections: PropTypes.array.isRequired,

  /**
   * A style to apply to the section list container
   */
  style: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.object,
  ])
};

var styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'transparent',
    alignItems:'center',
    justifyContent:'center',
    overflow: 'hidden',
    right: 0,
    top: 0,
    bottom: 0,
    width: 15
  },

  item: {
    padding: 0
  },

  text: {
    fontWeight: '700',
    color: '#008fff'
  },

  inactivetext: {
    fontWeight: '700',
    color: '#CCCCCC'
  }
});

module.exports = SectionList;
