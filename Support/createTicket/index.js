import React, { Component } from 'react';
import { View, Picker, Text, ScrollView, TextInput, TouchableOpacity, Image, Button, Alert, Dimensions } from 'react-native';
import TicketButton from 'components/Support/createTicket/TicketButton.js';
import styles from 'components/Support/createTicket/Styles.js';
import Api from 'services/api/index.js';
import { Routes, BasicStyles } from 'common';
import Dropdown from 'components/InputField/Dropdown'
import { Spinner } from 'components';
import { Card } from 'react-native-elements'
import ImagePicker from 'react-native-image-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faImages } from '@fortawesome/free-solid-svg-icons';
import Color from 'common/Color';
import {connect} from 'react-redux';
const width = Math.round(Dimensions.get('window').width);

class CreateTicket extends Component {

  constructor(props) {
    super(props);
    this.state = {
      title: null,
      description: null,
      type: null,
      isLoading: false,
      imageModalUrl: null,
      photo: null,
      isImageModal: false,
      images: [],
      ticketTypes1: [
        {
          id: 1,
          type: 'VERIFICATION ISSUE',
          description: 'Send cash and allow our partners to process or deliver the cash to your receiver.'
        },
        {
          id: 2,
          type: 'ACCOUNT ISSUE',
          description: 'Withdraw cash from your wallet and let our partners nearby process or deliver the cash to your specified location.'
        }
      ],
      ticketTypes2: [
        {
          id: 3,
          type: 'TRANSACTION ISSUE',
          description: 'Cash In to your wallet and let our nearby partners process or pickup the cash from your specified location.'
        },
        {
          id: 4,
          type: 'OTHERS',
          description: "Don't have time and want to pay your bills either online or onsite? Our partners will handle your payments"
        }
      ],
      selected: null,
      active: null
    };
  }

  selectedValue = value => {
    this.setState({ type: value });
  };

  onSelect(item, index){
    this.setState({
      active: this.active == index ? null : index,
      selected: item,
      type: item.type
    })
  }

  create = () => {
    if(this.state.images.length === 0 || this.state.title === '' || this.state.description === '' || this.state.title === null || this.state.description === null) {
      Alert.alert(
        'Error in creating ticket.',
        'Please complete the fields including image.',
        [
          {text: 'Ok'}
        ],
        { cancelable: false }
      )
      return
    }
    let account_id = this.props.navigation.state.params.user.id
    let parameter = {
      account_id: account_id,
      content: this.state.title,
      status: 'pending',
      type: this.state.type,
      images: this.state.images.join(' ')
    }
    this.setState({ isLoading: true })
    Api.request(Routes.ticketsCreate, parameter, response => {
      this.setState({ isLoading: false })
      if (response.data != null) {
        this.props.navigation.push('supportStack');
      }
    })
  }

  choosePhoto = () => {
    const options = {
      noData: false,
    }
    ImagePicker.launchImageLibrary(options, response => {
      if (response.uri) {
        let images = this.state.images;
        images.push(`data:image/png;base64,${response.data}`);
        this.setState({ images: images });
      } else {
        this.setState({ photo: null });
      }
    })
  }


  setImage = (url) => {
    this.setState({ imageModalUrl: url })
    setTimeout(() => {
      this.setState({ isImageModal: true })
    }, 500)
  }

  chooseTicketType1 = () => {
    const { theme } = this.props.state;
    return (
      <View style={{
        flexDirection: 'row',
      }}>
        {
          this.state.ticketTypes1 && this.state.ticketTypes1.map((item, index) => (
           
            <TouchableOpacity
              style={[styles.CardContainer, {justifyContent: 'center', backgroundColor: (this.state.selected && this.state.selected.id == item.id) ? (theme ? theme.primary : Color.primary) : (theme ? theme.secondary : Color.secondary)}]}
              onPress={() => {
                this.onSelect(item, index);
              }}
              key={index}>
              <View style={styles.title}>
                <Text
                  style={[
                    styles.titleText,
                    {fontSize: BasicStyles.titleText.fontSize},
                  ]}>
                  {item.type}
                </Text>
              </View>
              <View style={[styles.description, {
                paddingBottom: 10
              }]}>
                <Text
                  style={[
                    styles.descriptionText,
                    {
                      fontSize: BasicStyles.titleText.fontSize
                    },
                  ]}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
            
          ))
        }
      </View>
    );
  }

  chooseTicketType2 = () => {
    const { theme } = this.props.state;
    return (
      <View style={{
        flexDirection: 'row',
        marginTop: 10,
        padding: 10
      }}>
        {
          this.state.ticketTypes2 && this.state.ticketTypes2.map((item, index) => (
           
            <TouchableOpacity
              style={[styles.CardContainer, {justifyContent: 'center', backgroundColor: (this.state.selected && this.state.selected.id == item.id) ? (theme ? theme.primary : Color.primary) : (theme ? theme.secondary : Color.secondary)}]}
              onPress={() => {
                this.onSelect(item, index);
              }}
              key={index}>
              <View style={styles.title}>
                <Text
                  style={[
                    styles.titleText,
                    {fontSize: BasicStyles.titleText.fontSize},
                  ]}>
                  {item.type}
                </Text>
              </View>
              <View style={[styles.description, {
                paddingBottom: 10
              }]}>
                <Text
                  style={[
                    styles.descriptionText,
                    {
                      fontSize: BasicStyles.titleText.fontSize
                    },
                  ]}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
            
          ))
        }
      </View>
    );
  }

  render() {
    let data = [{ title: 'Bug', value: 'bug' }, { title: 'Question', value: 'question' }, { title: 'Enhancement', value: 'enhancement' }, { title: 'Invalid', value: 'invalid' }, { title: 'Duplicate', value: 'duplicate' }, { title: 'Help wanted', value: 'help wanted' }]
    return (
      <View style={styles.CreateTicketContainer}>
        {this.state.type === null && (<Text style={{
          fontWeight: 'bold',
          paddingTop: 10,
          paddingBottom: 40
        }}>Select type of ticket:</Text>)}
        {this.state.type === null && this.chooseTicketType1()}
        {this.state.type === null && this.chooseTicketType2()}
        {this.state.type && (
        <ScrollView>
          <View>
          <View style={styles.InputContainer}>
              <Text style={styles.TicketInputTitleContainer}>Type of Ticket:</Text>
              <TextInput
                style={[BasicStyles.formControl, {backgroundColor: Color.gray}]}
                value={this.state.type}
                editable={false}
              />
            </View>
            <View style={styles.InputContainer}>
              <Text style={styles.TicketInputTitleContainer}>Title</Text>
              <TextInput
                style={BasicStyles.formControl}
                onChangeText={(title) => this.setState({ title })}
                value={this.state.title}
                placeholder={'Title'}
              />
            </View>
            <View style={styles.InputContainer}>
              <Text style={styles.TicketInputTitleContainer}>Description</Text>
              <TextInput
                style={{
                  borderColor: Color.lightGray,
                  borderWidth: 1,
                  width: width - 40,
                  paddingLeft: 10,
                  marginBottom: 20,
                  borderRadius: 25,
                  height: 140
                }}
                onChangeText={(description) => this.setState({ description })}
                value={this.state.description}
                placeholder={'Description'}
                numberOfLines={6}
                multiline = {true}
              />
            </View>
            {this.state.isLoading ? <Spinner mode="overlay" /> : null}
            <Text style={{fontWeight: 'bold'}}>Attached file(s)</Text>
            <View style={{flexDirection: 'row', padding: 15, width: '90%'}}>
              <TouchableOpacity
                style={{marginBottom: 25, padding: 15}}
                onPress={() => {
                  this.choosePhoto();
                }}>
                <FontAwesomeIcon
                  icon={faImages}
                  style={{
                    color: Color.gray, marginRight: 5
                  }}
                  size={50}
                />
              </TouchableOpacity>
              <ScrollView horizontal={true}>
                {this.state.images.map((u, i) => {
                  return (
                    <View key={i}>
                      <Image
                        source={{ uri: u }}
                        style={styles.Image}
                      />
                    </View>
                  )
                })}
              </ScrollView>
            </View>
          </View>
          <View style={styles.TicketButtonContainer}>
          <TicketButton
            buttonColor="#22B173"
            buttonWidth={350}
            buttonHeight={50}
            fontSize={14}
            textColor="#FFFFFF"
            buttonText="Create Ticket"
            onPress={this.create.bind(this)}
          />
          </View>
        </ScrollView>)}
      </View>
    );
  }
}

const mapStateToProps = (state) => ({state: state});

const mapDispatchToProps = (dispatch) => {
  const {actions} = require('@redux');
  return {
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateTicket);