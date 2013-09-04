Questions = new Meteor.Collection("Questions");
Sessions = new Meteor.Collection("Sessions");
Proppycock = new Meteor.Collection("Proppycock");
Superlatives = new Meteor.Collection("Superlatives");

var id = null;

if (Meteor.isClient) {

  // Setup
  Meteor.subscribe('Questions');
  Meteor.subscribe("Proppycock");
  Meteor.subscribe("Sessions");

  Session.set('questionNumber', 0);

  /* Questions */
  Template.questions.Questions = function() {
    return Questions.find({ SubQuestion: false }, { sort: { Order : 1 }});
  };

  Template.questions.SubQuestions = function() {
    return Questions.find({ SubQuestion: true, QuestionNumber : this.Order }, { sort: { AnswerNumber: 1 }}).fetch();
  };

  Template.questions.numberOfAnswers = function() {
    return Math.floor((this.Answers.length - 1) / 6) + 1;
  };

  Template.questions.has_subQuestions = function() {
    return this.HasSubQuestion ? "has_sub" : "";
  };

  function changeQuestionNumber(increase) {
    var qNo = Session.get('questionNumber');
    qNo = increase ? qNo + 1 : qNo - 1;
    qNo = qNo >= 0 ? qNo : 0;

    Session.set('questionNumber', qNo);
    var ol = $('#questions > ol');

    // Change active class
    if (increase)
      $('#questions li.active').removeClass('active').next().addClass('active');
    else
      $('#questions li.active').removeClass('active').prev().addClass('active');

    // Whether it's the last slide or not
    var last = (qNo == document.getElementById('questions').firstElementChild.children.length)
      || (!increase && qNo + 1 == document.getElementById('questions').firstElementChild.children.length);
      
    // Move backwards/forwards
    setTimeout(function() {
      ol.animate({
        marginLeft: -($('ol').children().first().outerWidth(true) * qNo)
      }, 600, 'easeInOutQuint', function() {
        // Reset sub-question
        $('#questions > ol > li').eq(increase ? qNo - 1 : qNo + 1).css("margin-top", 0);
      });
    }, last && !increase ? 300 : 0) 
    
    // Open proppycock
    if (last) {
      setTimeout(function() {
        if (increase) 
          document.getElementById('proppycock').className = "active";
        else 
          document.getElementById('proppycock').className = "";
      }, increase ? 600 : 0);
      if (increase) 
        document.getElementById('tweet').className = "active";
      else 
        document.getElementById('tweet').className = "";
    }
  }

  function getPostcodeInfo(postcode) {
    // TODO: use postcode details for something interesting.
  }

  function showNextQuestion(e, t) {
    changeQuestionNumber(true);

    if ($(e.toElement).closest('.question').parent().index()) {
      var questionId = e.toElement.parentElement.parentElement.id;
      var parentQuestionId = e.toElement.parentElement.parentElement.dataset.parentid;
      var answer = e.toElement.outerText;
      var answerNo = $(e.toElement.parentElement).index() + 1;

      appendInformation(questionId, parentQuestionId, answer, answerNo);
    }
  }

  function showNextSubQuestion(e, t) {
    var answerNo = $(e.currentTarget.parentElement).index() + 1;

    var nextQuestion = $(t.find('.question.answerNumber'+ ($(e.currentTarget.parentElement).index() + 1)));

    if (nextQuestion != null && nextQuestion.length > 0) {
      var offsetTop = nextQuestion.position().top;
      
      nextQuestion.parent().animate({
        marginTop: -offsetTop
      }, 600, 'easeInOutQuint');
    } else {
      showNextQuestion(e, t);
    }
  }

  Template.questions.events({
    'keyup #postcode > input' : function(e, t) {
      var postcodeInput = e.currentTarget.value;

      if (postcodeInput.length > 4) {
        var postcode_regex = /^[A-Z].+[0-9].+[A-Z]$/i;
        var className = e.currentTarget.parentElement.className;

        if (postcodeInput.match(postcode_regex) != null) {
          // Add success class to field group.
          if (className.indexOf('success') < 0) {
            if (className.indexOf('error') > 0) 
              e.currentTarget.parentElement.className = e.currentTarget.parentElement.className.replace('error', 'success');
            else
              e.currentTarget.parentElement.className += ' success'
          }
          // Undisable begin button
          e.currentTarget.nextElementSibling.disabled = false;
          e.currentTarget.nextElementSibling.className += ' btn-warning'
        }
        else {
          // Add error class to field group.
          if (className.indexOf('error') < 0) {
            if (className.indexOf('success') > 0)
              e.currentTarget.parentElement.className = e.currentTarget.parentElement.className.replace('success', 'error');
            else
              e.currentTarget.parentElement.className += ' error';
          }
          // Disable begin button
          e.currentTarget.nextElementSibling.disabled = true;
          e.currentTarget.nextElementSibling.className = e.currentTarget.nextElementSibling.className.replace('btn-warning', '');
        }
      }
    },
    // Temp until postcode put back in
    'click #begin' : function(e, t) {
      // Show proppycock description
      document.getElementById('proppycock').className = document.getElementById('proppycock').className += ' begun';   

      // Set up initial session + choose generated description template
      setUpSession();
      getTemplate(); 
    },
    'click #postcode > button' : function(e, t) {
      // Get area info
      var postcodeInput = e.currentTarget.value;
      getPostcodeInfo(postcodeInput);

      // Unfocus textbox
      document.getElementById('postcode').firstElementChild.blur();

      // Set up initial session + choose generated description template
      setUpSession();
      getTemplate();

      changeQuestionNumber(true);
    },
    'click li > button' : function (e, t) {
      // No sub questions 
      if (e.currentTarget.parentElement.parentElement.className.indexOf("has_sub") > 0) {
        showNextSubQuestion(e, t);
      } else {
        var delay = 0;
        if (document.getElementById('proppycock').className.indexOf('begun') > 0)
          delay = 300;
        setTimeout(function() {
          showNextQuestion(e, t);
        }, delay);
      }
    },
    'click #back' : function (e, t) {
      changeQuestionNumber(false);
      var qNo = Session.get('questionNumber');

      // Remove answer data
      Sessions.update(
        { _id: id },
        { $pull: { "answers" : { questionNumber: qNo } } }
      );

      regenerateProppycock();
    }
  });

  /* Proppycock */
  Template.proppycock.active = function() {
    return window.location.pathname.indexOf('post') > 0 ? "active" : "";
  }

  Template.proppycock.invokeAfterLoad = function() {
    Meteor.defer(function() {
      var text = document.getElementById('proppycock_text').value;
      if (text != '' && text != null)
        document.getElementById('proppycock').className = document.getElementById('proppycock').className += ' begun'
    });
  };

  Template.proppycock.events({
    'click form > label' : function(e, t) {
      // Set timeout because so that input is changed in time
      setTimeout(function() {
        regenerateProppycock();
      }, 50);
    }
  });

  function createTweetLink() {
    var url = "https://twitter.com/share?url=http://www.proppycock.com/posts/" + id;
    // add related
    url += "&related=" + encodeURIComponent("proppycock,wigwammhq");
    // add text
    url += "&text=" + encodeURIComponent("Property descriptions are a load of poppycock. Check out my proppycock description: ");
    // add via
    url += "&via=Proppycock";
    // add hashtags
    url += "&hashtags=proppycock"

    document.getElementById('tweet').href = url;
  }

  function getTemplate() {
    var descriptions = Proppycock.find({ }).fetch();
    var count = descriptions.length;

    // Choose random template
    var random = Math.round(Math.random() * (count - 1)) + 1;

    // Record template use
    Sessions.update({ _id : id },
      { $set: {
        templateNumber: random
      } 
    });

    setTemplate(random);
  }

  function getTemplateType() {
    var index;
    $('#proppycock label').each(function (i, el) {
      if (el.className.indexOf('checked') > 0) {
        index = i + 1;
        return false;
      }
    });

    return index;
  }

  function setTemplate(templateNumber) {
    var template = Proppycock.findOne({ Number: templateNumber });

    // Get generation choice
    var index = getTemplateType();

    // Insert into text area
    var proppycock = $('#proppycock_text');

    switch (index) {
      case (1):
        proppycock.val(template.Detailed);
        break;
      case (2):
        proppycock.val(template.Short);
        break;
      default:
        proppycock.val(template.Detailed);
        break;
    }
  }

  function appendInformation(questionId, parentQuestionId, answer, answerNo) {
    recordAnswer(questionId, parentQuestionId, answer, answerNo);

    if (questionId == 'standard')
      setSuperlatives(answerNo);

    var output = Questions.findOne({ Id: questionId }).Answers[answerNo - 1].Output;

    var proppycock = $('#proppycock_text');
    var toBeReplaced = '{{' + (parentQuestionId ? parentQuestionId : questionId) + '}}';
    proppycock.val(proppycock.val().replace(new RegExp(toBeReplaced, 'g'), output));
  }

  function setSuperlatives(superlativeType) {
    var superlatives = Superlatives.findOne({ Type: superlativeType }).Options;
    var count = superlatives.length;

    var proppycock = $('#proppycock_text');
    var superlativeCount = proppycock.val().split('{{superlative}}').length - 1;

    for (var i = 0; i < superlativeCount; i++) {
      var random = Math.round(Math.random() * (count - 1));
      var output = superlatives[random];

      proppycock.val(proppycock.val().replace("{{superlative}}", output));
    }
  }

  function recordAnswer(questionId, parentQuestionId, answer, answerNo) {
    Sessions.update({ _id: id }, 
      { $push: { "answers" : { 
        questionNumber: Session.get('questionNumber') - 1,
        questionId: questionId, parentQuestionId: parentQuestionId, answer: answer, 
        answerNo: answerNo } 
      } 
    });
  }

  function regenerateProppycock() {
    // Get existing answer set from session
    var session = Sessions.findOne({ _id: id });

    if (session != null) {
      // Reset to template
      setTemplate(session.templateNumber);

      // Loop through answers and insert into template
      var proppycock = $('#proppycock_text');

      if (session.answers != null)
        for (var i = 0; i < session.answers.length; i++) {
          var answer = session.answers[i];

          if (answer.questionId == 'standard') {
            setSuperlatives(answer.answerNo);
          } else {
            var answerOutput = Questions.findOne({ Id: answer.questionId }).Answers[answer.answerNo - 1].Output;
            var questionId = answer.parentQuestionId ? answer.parentQuestionId : answer.questionId;
            
            var toBeReplaced = '{{' + questionId + '}}';
            proppycock.val(proppycock.val().replace(new RegExp(toBeReplaced, 'g'), answerOutput));
          }
        }
    }
  }

  /* Posts */
  Template.post.invokeAfterLoad = function() {
    Meteor.defer(function() {
      regenerateProppycock();
    });
  }

  /* Sessions */
  function setUpSession() {
    var gGuid = guid();

    // Creates an object to log the answers
    Sessions.insert({ guid: gGuid });
    id = Sessions.findOne({ guid: gGuid })._id;

    var evt = document.createEvent('UIEvents');
    evt.initUIEvent('resize', true, false, window, 0);
    window.dispatchEvent(evt);

    createTweetLink();
  }

  function guid() {
    return guidSection() + guidSection() + '-' + guidSection() + '-' +
      guidSection() + '-' + guidSection() + '-' + guidSection() +
      guidSection() + guidSection();

    function guidSection() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
  }

  // Routing
  Meteor.Router.add({
    '/' : 'questions',
    '/posts/:id': function(postId) {
      id = postId;

      if (Sessions.findOne({ _id : id }))
        return 'post';
      else 
        return 'questions';
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}

