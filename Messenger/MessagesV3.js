import React, { Component } from 'react';
import {
  TextInput,
  View,
  Image,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Dimensions,
  Alert
} from 'react-native';
import { Routes, Color, BasicStyles, Helper } from 'common';
import { Spinner, UserImage } from 'components';
import Api from 'services/api/index.js';
import { connect } from 'react-redux';
import Config from 'src/config.js';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faImage, faPaperPlane, faLock } from '@fortawesome/free-solid-svg-icons';
import ImageModal from 'components/Modal/ImageModal.js';
import ImagePicker from 'react-native-image-picker';
import Style from 'modules/messenger/Style.js'
import Modal from 'components/Modal/Sketch';
import MessageOptions from './Options.js'
import moment from 'moment';
import Button from 'components/Form/Button';
import { NavigationActions, StackActions } from 'react-navigation';
import Skeleton from 'components/Loading/Skeleton';
import ScreenshotHandler from 'services/ScreenshotHandler';

const DeviceHeight = Math.round(Dimensions.get('window').height);
const DeviceWidth = Math.round(Dimensions.get('window').width);

class MessagesV3 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      selected: null,
      newMessage: null,
      imageModalUrl: null,
      isImageModal: false,
      photo: null,
      keyRefresh: 0,
      isPullingMessages: false,
      offset: 0,
      limit: 5,
      isLock: false,
      settingsMenu: [],
      settingsBreadCrumbs: ['Settings'],
      group: null,
      request_id: null,
      isViewing: false,
      members: [],
      data: null
    }
  }

  componentDidMount() {
    ScreenshotHandler.disableScreenshot()
    const { setMessageTitle } = this.props;
    setMessageTitle(null)
    const { user } = this.props.state
    if (user == null) return
    this.retrieveRequest()
  }

  retrieveRequest() {
    const { user } = this.props.state;
    const { data } = this.props.navigation.state.params;
    const { setMessageTitle } = this.props;
    let parameter = {
      condition: [{
        value: data.title,
        clause: '=',
        column: 'code'
      }],
      account_id: user.id
    };
    this.setState({ isLoading: true });
    console.log(parameter, Routes.requestRetrieveItem)
    Api.request(Routes.requestRetrieveItem, parameter, (response) => {
      this.setState({ isLoading: false });
      this.retrieveGroup()
      if (response.data.length > 0) {
        this.setState({
          data: response.data[0]
        });
        setMessageTitle({
          amount: response.data[0].amount,
          currency: response.data[0].currency
        })
      }
    }, error => {
      console.log('error', error)
      this.setState({ isLoading: false });
    });
  }

  componentWillUnmount() {
    const { data } = this.props.navigation.state.params;
    const { setMessengerGroup, setMessagesOnGroup } = this.props
    setMessengerGroup(null)
    setMessagesOnGroup({
      groupId: null,
      messages: null
    })
    if (data == null) {
      return
    }
  }

  navigateToScreen = () => {
    const navigateAction = NavigationActions.navigate({
      routeName: 'drawerStack',
      action: StackActions.reset({
        index: 0,
        key: null,
        actions: [
          NavigationActions.navigate({
            routeName: 'Dashboard', params: {
              initialRouteName: 'Dashboard',
              index: 0
            }
          }),
        ]
      })
    });
    this.props.navigation.dispatch(navigateAction);
  }

  retrieve = (data) => {
    const { offset, limit } = this.state
    this.setState({ isLoading: true });
    const parameter = {
      condition: [{
        value: data.id,
        column: 'messenger_group_id',
        clause: '='
      }],
      sort: {
        'created_at': 'DESC'
      },
      limit,
      offset: offset * limit,
    }
    console.log(parameter, '--')
    Api.request(Routes.messengerMessagesRetrieve, parameter, response => {
      this.setState({ isLoading: false, offset: offset + limit });
      if (response.data.length > 0) {
        this.setState({ sender_id: response.data[0].account_id });
        this.setState({ request_id: response.data[0].id });
      }
      const { setMessagesOnGroup } = this.props;
      setMessagesOnGroup({
        messages: response.data.reverse(),
        groupId: this.props.navigation.state.params.data.id
      })
    }, error => {
      this.setState({ isLoading: false });
      console.log({ retrieveMessagesError: error })
    });
  }

  retrieveMembers = (data) => {
    this.setState({ isLoading: true });
    const parameter = {
      condition: [{
        value: data.id,
        column: 'messenger_group_id',
        clause: '='
      }],
      sort: {
        'created_at': 'DESC'
      },
      limit: 2,
      offset: 0,
    }
    Api.request(Routes.messengerMembersRetrieve, parameter, response => {
      this.setState({ isLoading: false });
      if (response.data.length > 0) {
        this.setState({ members: response.data });
      }
    }, error => {
      this.setState({ isLoading: false });
      console.log({ retrieveMessagesError: error })
    });
  }

  retrieveMoreMessages = () => {
    const { offset, limit } = this.state
    const { messengerGroup, messagesOnGroup } = this.props.state;
    const { setMessagesOnGroup } = this.props;

    if (messengerGroup == null) {
      return
    }

    this.setState({ isLoading: true });

    const parameter = {
      condition: [{
        value: messengerGroup.id,
        column: 'messenger_group_id',
        clause: '='
      }],
      sort: {
        'created_at': 'DESC'
      },
      offset,
      limit,
    }

    Api.request(Routes.messengerMessagesRetrieve, parameter, response => {
      const newMessages = [...response.data.reverse(), ...messagesOnGroup.messages]
      this.setState({ isLoading: false, offset: offset + limit });
      setMessagesOnGroup({
        messages: newMessages,
        groupId: messengerGroup.id
      })
    }, error => {
      this.setState({ isLoading: false });
      console.log({ retrieveMoreMessagesError: error })
    });
  }

  retrieveGroup = (flag = null) => {
    const { user } = this.props.state;
    const { setMessengerGroup } = this.props;
    const { data } = this.props.navigation.state.params;
    if (user == null) {
      return
    }
    let parameter = {
      condition: [{
        value: data.title,
        column: 'title',
        clause: '='
      }],
      account_id: user.id
    }
    this.setState({ isLoading: true });
    Api.request(Routes.messengerGroupRetrieve, parameter, response => {
      if (response.data.length > 0) {
        setMessengerGroup({
          ...data,
          id: response.data[0].id
        });
        setTimeout(() => {
          this.retrieve(response.data[0])
          this.retrieveMembers(response.data[0])
        }, 500)
      } else {
        this.setState({ isLoading: false });
      }
    }, error => {
      this.setState({ isLoading: false });
    });
  }

  sendNewMessage = () => {
    const { messengerGroup, user } = this.props.state;
    const { updateMessagesOnGroup } = this.props;
    const { members } = this.state;
    if (messengerGroup == null || user == null || this.state.newMessage == null) {
      return
    }
    let parameter = {
      messenger_group_id: messengerGroup.id,
      message: this.state.newMessage,
      account_id: user.id,
      status: 0,
      payload: 'text',
      payload_value: null,
      code: 1,
      to: members[0]?.account_id === user.id ? members[1]?.account_id : members[0]?.account_id
    }
    let newMessageTemp = {
      ...parameter,
      account: {
        profile: user.profile,
        information: {
          first_name: user.information?.first_name,
          last_name: user.information?.last_name,
        },
        username: user.username
      },
      created_at_human: moment(new Date()).format('MMMM DD, YYYY'),
      sending_flag: true,
      error: null
    }
    updateMessagesOnGroup(newMessageTemp);
    this.setState({ newMessage: null })
    console.log(Routes.messengerMessagesCreate, parameter)
    Api.request(Routes.messengerMessagesCreate, parameter, response => {
      if (response.data != null) {
        const { messagesOnGroup } = this.props.state;
        const { setMessagesOnGroup } = this.props;
        if (messagesOnGroup && messagesOnGroup.messages.length > 0) {
          let temp = messagesOnGroup.messages;
          temp[messagesOnGroup.messages.length - 1].sending_flag = false
          setMessagesOnGroup({
            groupId: messengerGroup.id,
            messages: temp
          })
        }
      }
    });
  }

  sendImageWithoutPayload = (parameter) => {
    const { updateMessageByCode } = this.props;

    Api.request(Routes.mmCreateWithImageWithoutPayload, parameter, response => {
      if (response.data != null) {
        updateMessageByCode(response.data);
      }
    }, error => {
      console.log({ sendImageWithoutPayloadError: error })
    })
  }

  handleChoosePhoto = () => {
    const { user, messengerGroup, messagesOnGroup } = this.props.state;
    const options = {
      noData: true,
      error: null
    }
    if (messengerGroup == null) {
      return
    }
    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        this.setState({ photo: null })
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        this.setState({ photo: null })
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
        this.setState({ photo: null })
      } else {
        if (response.fileSize >= 1000000) {
          Alert.alert('Notice', 'File size exceeded to 1MB')
          return
        }

        this.setState({ photo: response })
        const { updateMessagesOnGroup } = this.props;
        let formData = new FormData();
        let uri = Platform.OS == "android" ? response.uri : response.uri.replace("file://", "/private");
        formData.append("file", {
          name: response.fileName,
          type: response.type,
          uri: uri
        });
        formData.append('file_url', response.fileName);
        formData.append('account_id', user.id);

        let parameter = {
          messenger_group_id: messengerGroup.id,
          message: null,
          account_id: user.id,
          status: 0,
          payload: 'image',
          payload_value: null,
          url: uri,
          code: messagesOnGroup.messages.length + 1
        }
        let newMessageTemp = {
          ...parameter,
          account: user,
          created_at_human: null,
          sending_flag: true,
          files: [{
            url: uri
          }],
          error: null
        }
        updateMessagesOnGroup(newMessageTemp);

        Api.uploadByFetch(Routes.imageUploadUnLink, formData, imageResponse => {
          // add message
          if (imageResponse.data != null) {
            parameter = {
              ...parameter,
              url: imageResponse.data
            }
            this.sendImageWithoutPayload(parameter)
          }
        }, error => {
          console.log({ imageError: error })
        })
      }
    })
  }

  setImage = (url) => {
    this.setState({ imageModalUrl: url })
    setTimeout(() => {
      this.setState({ isImageModal: true })
    }, 500)
  }


  _image = (item) => {
    const { messengerGroup, user, theme } = this.props.state;
    return (
      <View>
        {
          item.payload_value != null && Platform.OS == 'android' && (
            <Text style={[Style.messageTextRight, {
              backgroundColor: item.validations.status == 'approved' ? Color.primary : Color.danger
            }]}>{item.validations.payload} - {item.validations.status}</Text>
          )
        }
        {
          item.payload_value != null && Platform.OS == 'ios' && (
            <View style={[Style.messageTextRight, {
              backgroundColor: item.validations.status == 'approved' ? Color.primary : Color.danger
            }]}>
              <Text style={Style.messageTextRightIOS}>
                {item.validations.payload} - {item.validations.status}
              </Text>
            </View>
          )
        }
        <View style={{
          flexDirection: 'row',
          marginTop: 10
        }}>
          {
            item.files.map((imageItem, imageIndex) => {
              return (
                <TouchableOpacity
                  onPress={() => this.setImage(Config.BACKEND_URL + imageItem.url)}
                  style={Style.messageImage}
                  key={imageIndex}
                >
                  {
                    item.sending_flag == true && (
                      <Image source={{ uri: imageItem.url }} style={Style.messageImage} key={imageIndex} />
                    )
                  }
                  {
                    item.sending_flag != true && (
                      <Image source={{ uri: Config.BACKEND_URL + imageItem.url }} style={Style.messageImage} key={imageIndex} />
                    )
                  }

                </TouchableOpacity>
              );
            })
          }
        </View>
        {
          messengerGroup?.account_id == user.id &&
          item != null && item.validations != null &&
          item.validations.status != 'approved' &&
          (
            <View style={{
              flexDirection: 'row',
              marginTop: 10
            }}>
              <View style={{
                width: '45%',
                height: 50,
                marginRight: '5%'
              }}>
                <TouchableOpacity
                  onPress={() => {
                    this.updateValidation(item.validations, 'declined')
                  }}
                  style={[Style.templateBtn, {
                    width: '100%',
                    height: 40,
                    borderColor: Color.danger
                  }]}
                >
                  <Text style={[Style.templateText, {
                    color: Color.danger
                  }]}>Decline</Text>
                </TouchableOpacity>
              </View>
              <View style={{
                width: '45%',
                height: 50,
                marginRight: '5%'
              }}>
                <TouchableOpacity
                  onPress={() => {
                    this.updateValidation(item.validations, 'approved')
                  }}
                  style={[Style.templateBtn, {
                    width: '100%',
                    height: 40,
                    borderColor: theme ? theme.primary : Color.primary
                  }]}
                >
                  <Text style={[Style.templateText, {
                    color: theme ? theme.primary : Color.primary
                  }]}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }
      </View>
    );
  }

  _imageTest = (item) => {
    return (
      <View style={{
        flexDirection: 'row'
      }}>
        <TouchableOpacity
          onPress={() => this.setImage(item.uri)}
          style={Style.messageImage}
        >
          <Image source={{ uri: item.uri }} style={Style.messageImage} />
        </TouchableOpacity>
      </View>
    );
  }

  _headerRight = (item) => {
    return (
      <View style={{
        flexDirection: 'row',
        height: 30,
        alignItems: 'center'
      }}>
        <UserImage user={item.account} style={{
          width: 25,
          height: 25
        }} />
        <Text style={{
          paddingLeft: 10
        }}>{item.account?.information?.first_name ? item.account?.information?.first_name + ' ' + item.account?.information?.last_name : item?.account?.username}</Text>
      </View>
    );
  }

  _headerLeft = (item) => {
    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        height: 30,
        alignItems: 'center'
      }}>
        <Text style={{
          paddingRight: 10
        }}>{item.account?.information?.first_name ? item.account?.information?.first_name + ' ' + item.account?.information?.last_name : item?.account?.username}</Text>
        <UserImage user={item.account} style={{
          width: 25,
          height: 25
        }} />
      </View>
    );
  }

  _rightTemplate = (item, index) => {
    const { theme, messagesOnGroup } = this.props.state;
    return (
      <View>
        {(index > 0 && messagesOnGroup && messagesOnGroup.messages != null) && item.account_id != (messagesOnGroup.messages[index - 1].account_id) && (this._headerRight(item, index))}
        {
          index == 0 && (this._headerRight(item, index))
        }
        <Text style={[Style.dateText, {
          textAlign: 'left'
        }]}>{item.created_at_human}</Text>
        {
          item.message != null && Platform.OS == 'android' && (
            <Text style={[Style.messageTextRight, {
              backgroundColor: theme ? theme.primary : Color.primary
            }]}>{item.message}</Text>
          )
        }
        {
          item.message != null && Platform.OS == 'ios' && (
            <View style={[Style.messageTextRight, {
              backgroundColor: theme ? theme.primary : Color.primary
            }]}>
              <Text style={Style.messageTextRightIOS}>{item.message}</Text>
            </View>
          )
        }
        {
          item.payload == 'image' && (this._image(item))
        }
      </View>
    );
  }

  _leftTemplate = (item, index) => {
    const { theme, messagesOnGroup } = this.props.state;
    return (
      <View>
        {(index > 0 && messagesOnGroup && messagesOnGroup.messages != null) && item.account_id != (messagesOnGroup.messages[index - 1].account_id) && (this._headerLeft(item, index))}
        {
          index == 0 && (this._headerLeft(item, index))
        }
        <Text style={[Style.dateText, {
          textAlign: 'right'
        }]}>{item.created_at_human}</Text>
        {
          item.message != null && Platform.OS == 'android' && (
            <Text style={[Style.messageTextLeft, {
              backgroundColor: theme ? theme.primary : Color.primary
            }]}>{item.message}</Text>
          )
        }
        {
          item.message != null && Platform.OS == 'ios' && (
            <View style={[Style.messageTextLeft, {
              backgroundColor: theme ? theme.primary : Color.primary
            }]}>
              <Text style={Style.messageTextLeftIOS}>{item.message}</Text>
            </View>
          )
        }
        {
          item.payload == 'image' && (this._image(item))
        }
        {
          item.sending_flag == true && (
            <Text style={{
              fontSize: 10,
              color: Color.gray,
              textAlign: 'right'
            }}>Sending...</Text>
          )
        }
      </View>
    );
  }

  _conversations = (item, index) => {
    const { user, messagesOnGroup } = this.props.state;
    return (
      <View style={{
        width: '100%',
        marginBottom: index == (messagesOnGroup.messages.length - 1) ? 50 : 0
      }}>
        <View style={{
          alignItems: 'flex-end'
        }}>
          {item.account_id == user.id && (this._leftTemplate(item, index))}
        </View>
        <View style={{
          alignItems: 'flex-start'
        }}>
          {item.account_id != user.id && (this._rightTemplate(item, index))}
        </View>
      </View>
    );
  }

  _footer = () => {
    const { theme } = this.props.state;
    return (
      <View style={{
        flexDirection: 'row'
      }}>
        <TouchableOpacity
          onPress={() => this.handleChoosePhoto()}
          style={{
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            width: '10%'
          }}
        >
          <FontAwesomeIcon
            icon={faImage}
            size={BasicStyles.iconSize}
            style={{
              color: theme ? theme.primary : Color.primary
            }}
          />
        </TouchableOpacity>
        <TextInput
          style={Style.formControl}
          onChangeText={(newMessage) => this.setState({ newMessage })}
          value={this.state.newMessage}
          placeholder={'Type your message here ...'}
          placeholderTextColor={Color.darkGray}
        />
        <TouchableOpacity
          onPress={() => this.sendNewMessage()}
          style={{
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            width: '10%'
          }}
        >
          <FontAwesomeIcon
            icon={faPaperPlane}
            size={BasicStyles.iconSize}
            style={{
              color: theme ? theme.primary : Color.primary
            }}
          />
        </TouchableOpacity>
      </View>
    );
  }

  _flatList = () => {
    const { user, messagesOnGroup } = this.props.state;
    return (
      <View style={{
        width: '100%',
        height: '100%'
      }}>
        {
          messagesOnGroup != null && messagesOnGroup.messages != null && user != null && (
            <FlatList
              data={messagesOnGroup.messages}
              extraData={this.props}
              ItemSeparatorComponent={this.FlatListItemSeparator}
              style={{
                marginBottom: 50,
                flex: 1,

              }}
              renderItem={({ item, index }) => (
                <View>
                  {this._conversations(item, index)}
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
          )
        }
      </View>
    );
  }

  cloneMenu() {
    const { viewMenu } = this.props // new
    viewMenu(false) // new
  }

  render() {
    const {
      isLoading,
      isImageModal,
      imageModalUrl,
      photo,
      keyRefresh,
      isPullingMessages,
      isLock,
      isViewing,
      members,
      data
    } = this.state;
    const { messengerGroup, user, viewField, theme } = this.props.state;
    console.log('[MESSEGER GROUP]', this.props.state.viewField);
    return (
      <SafeAreaView>
        {
          // ON DEPOSITS (IF CONVERSATION IS NOT YET AVAILABLE)
          isLock && (
            <View style={{
              height: DeviceHeight - 150,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <FontAwesomeIcon
                icon={faLock}
                size={DeviceWidth * 0.20}
                style={{ color: Color.black, marginBottom: 10 }}
              />
              <Text style={{ color: Color.darkGray, fontSize: 13 }}>
                Conversation is not yet available, try again later
              </Text>
            </View>
          )
        }
        <KeyboardAvoidingView
          behavior={'padding'}
          keyboardVerticalOffset={
            Platform.select({
              ios: () => 65,
              android: () => -200
            })()}
        >
          <View key={keyRefresh}>
            {isLoading ? <Skeleton size={1} template={'messages'} /> : null}
            <ScrollView
              ref={ref => this.scrollView = ref}
              onContentSizeChange={(contentWidth, contentHeight) => {
                if (!isPullingMessages) {
                  this.scrollView.scrollToEnd({ animated: true });
                }
              }}
              showsVerticalScrollIndicator={false}
              style={[Style.ScrollView, {
                height: '100%'
              }]}
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
                const isOnBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height
                const isOnTop = contentOffset.y <= 0

                if (isOnTop) {
                  if (this.state.isLoading == false) {
                    if (!isPullingMessages) {
                      this.setState({ isPullingMessages: true })
                    }
                    this.retrieveMoreMessages()
                  }
                }
                if (isOnBottom) {
                  if (this.state.isLoading == false && isPullingMessages) {
                    this.setState({ isPullingMessages: false })
                  }
                }
              }}
            >
              <View style={{
                flexDirection: 'row',
                width: '100%'
              }}>
                {this._flatList()}
              </View>
            </ScrollView>

            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              borderTopColor: Color.lightGray,
              borderTopWidth: 1,
              backgroundColor: Color.white
            }}>
              {
                messengerGroup != null && messengerGroup.status < 2 && !isViewing ? (
                  this._footer()
                ) : (
                  viewField === true ? (
                    this._footer()
                  ) : (
                    <View></View>
                  )
                )
              }
            </View>
            {data?.status >= 2 && <View style={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}>
              <View style={{
                position: 'absolute',
                bottom: 30,
                backgroundColor: Color.white
              }}>
                <Text style={{
                  marginBottom: 10
                }}>This transaction is already completed.</Text>
                <Button
                  title={'Go to Dashboard'}
                  onClick={() => this.navigateToScreen()}
                  style={{
                    width: '100%',
                    paddingLeft: 20,
                    paddingRight: 20,
                    backgroundColor: theme ? theme.secondary : Color.secondary
                  }}
                />
              </View>
            </View>}
            <ImageModal
              visible={isImageModal}
              url={imageModalUrl}
              action={() => this.setState({ isImageModal: false })}
            ></ImageModal>
            <Modal send={this.sendSketch} close={this.closeSketch} visible={this.state.visible} />
          </View>
        </KeyboardAvoidingView>
        {
          (data && this.props.navigation.state?.params?.data?.menuFlag) && (
            <MessageOptions
              requestId={this.state.request_id}
              messengerId={this.props.navigation.state.params.data?.id}
              data={data}
              members={members}
              navigation={this.props.navigation}
              updateMessagesOnGroup={this.props.updateMessagesOnGroup}
              updateMessageByCode={this.props.updateMessageByCode}
            />
          )
        }
      </SafeAreaView>
    );
  }
}
const mapStateToProps = state => ({ state: state });

const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    setMessagesOnGroup: (messagesOnGroup) => dispatch(actions.setMessagesOnGroup(messagesOnGroup)),
    setMessengerGroup: (messengerGroup) => dispatch(actions.setMessengerGroup(messengerGroup)),
    updateMessagesOnGroup: (message) => dispatch(actions.updateMessagesOnGroup(message)),
    updateMessageByCode: (message) => dispatch(actions.updateMessageByCode(message)),
    setUnReadMessages: (messages) => dispatch(actions.setUnReadMessages(messages)),
    updateMessagesOnGroup: (message) => dispatch(actions.updateMessagesOnGroup(message)),
    setMessageTitle: (messageTitle) => dispatch(actions.setMessageTitle(messageTitle))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MessagesV3);
