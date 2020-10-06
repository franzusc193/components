import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Picker} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSmile } from '@fortawesome/free-solid-svg-icons';
import { Color, BasicStyles } from 'common';
import { Dimensions } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
const width = Math.round(Dimensions.get('window').width);
const height = Math.round(Dimensions.get('window').height);
class Dropdown extends Component{

  constructor(props){
    super(props);
    this.state = {
      iosData: [],
      input: null
    }
  }

  componentDidMount(){
    this.dataOnIOS()
  }

  onChange(input){
    this.setState({input})
    this.props.onChange(input)
  }

  dataOnIOS(){
    const { data } = this.props;

    const iOSData = data.map((item) => {
      return {
        label: item.title,
        value: item.value
      };
    });
    this.setState({
      iOSData: iOSData
    })
  }

  render () {
    const { label, data, placeholder } = this.props;
    const { iOSData } = this.state;
    return (
        <View style={{
        }}>
          <Text style={{
            fontWeight: 'bold'
          }}>{label}</Text>
          {
            Platform.OS == 'android' && (
              <Picker selectedValue={this.state.input}
                onValueChange={(input) => this.onChange(input)}
                style={BasicStyles.pickerStyleCreate}
                >
                  {
                    data.map((item, index) => {
                      return (
                        <Picker.Item
                        key={index}
                        label={item.title} 
                        value={item.value}/>
                      );
                    })
                  }
                </Picker>
            )
          }
          {
            (Platform.OS == 'ios' && iOSData.length > 0) && (
              <RNPickerSelect
                onValueChange={(input) => this.onChange(input)}
                items={iOSData}
                style={BasicStyles.pickerStyleIOSNoMargin}
                placeholder={{
                  label: placeholder ? placeholder : 'Click to select',
                  value: null,
                  color: Color.primary
                }}
                />
            )
          }
        </View>
    );
  }
}
export default Dropdown;