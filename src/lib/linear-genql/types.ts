export default {
    "scalars": [
        4,
        5,
        7,
        9,
        12,
        17,
        18,
        20,
        25,
        33,
        35,
        96,
        101,
        104,
        105,
        106,
        111,
        112,
        114,
        115,
        117,
        119,
        124,
        126,
        130,
        132,
        140,
        141,
        155,
        173,
        177,
        178,
        181,
        187,
        193,
        195,
        205,
        211,
        212,
        258,
        267,
        294,
        296,
        304,
        306,
        307,
        308,
        309,
        318,
        319,
        328,
        341,
        348,
        350,
        351,
        352,
        357,
        375,
        380,
        396,
        399,
        400,
        405,
        413,
        436,
        445,
        448,
        483,
        546,
        547,
        558,
        560,
        561,
        583,
        587,
        588,
        628,
        668,
        687,
        691,
        711,
        713,
        717,
        720,
        840
    ],
    "types": {
        "CustomerNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "on_CustomerNotificationSubscription": [
                0
            ],
            "on_CustomViewNotificationSubscription": [
                366
            ],
            "on_CycleNotificationSubscription": [
                367
            ],
            "on_LabelNotificationSubscription": [
                368
            ],
            "on_ProjectNotificationSubscription": [
                369
            ],
            "on_InitiativeNotificationSubscription": [
                370
            ],
            "on_TeamNotificationSubscription": [
                371
            ],
            "on_UserNotificationSubscription": [
                372
            ],
            "__typename": [
                7
            ]
        },
        "Entity": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "on_CustomerNotificationSubscription": [
                0
            ],
            "on_CustomViewNotificationSubscription": [
                366
            ],
            "on_CycleNotificationSubscription": [
                367
            ],
            "on_LabelNotificationSubscription": [
                368
            ],
            "on_ProjectNotificationSubscription": [
                369
            ],
            "on_InitiativeNotificationSubscription": [
                370
            ],
            "on_TeamNotificationSubscription": [
                371
            ],
            "on_UserNotificationSubscription": [
                372
            ],
            "on_IssueNotification": [
                373
            ],
            "on_ProjectNotification": [
                376
            ],
            "on_InitiativeNotification": [
                377
            ],
            "on_OauthClientApprovalNotification": [
                378
            ],
            "on_DocumentNotification": [
                381
            ],
            "on_PostNotification": [
                382
            ],
            "on_CustomerNeedNotification": [
                383
            ],
            "on_CustomerNotification": [
                384
            ],
            "on_PullRequestNotification": [
                385
            ],
            "on_WelcomeMessageNotification": [
                386
            ],
            "__typename": [
                7
            ]
        },
        "Node": {
            "id": [
                4
            ],
            "on_CustomerNotificationSubscription": [
                0
            ],
            "on_User": [
                6
            ],
            "on_Organization": [
                8
            ],
            "on_Facet": [
                10
            ],
            "on_Team": [
                11
            ],
            "on_WorkflowState": [
                13
            ],
            "on_Issue": [
                16
            ],
            "on_Summary": [
                19
            ],
            "on_Cycle": [
                21
            ],
            "on_Document": [
                109
            ],
            "on_Project": [
                110
            ],
            "on_ProjectStatus": [
                113
            ],
            "on_Template": [
                116
            ],
            "on_ProjectUpdate": [
                118
            ],
            "on_Reaction": [
                120
            ],
            "on_Comment": [
                121
            ],
            "on_DocumentContent": [
                122
            ],
            "on_PullRequest": [
                123
            ],
            "on_Initiative": [
                129
            ],
            "on_InitiativeUpdate": [
                131
            ],
            "on_EntityExternalLink": [
                153
            ],
            "on_IntegrationsSettings": [
                154
            ],
            "on_InitiativeHistory": [
                158
            ],
            "on_ProjectMilestone": [
                172
            ],
            "on_AiPromptRules": [
                174
            ],
            "on_WelcomeMessage": [
                175
            ],
            "on_Post": [
                176
            ],
            "on_ExternalUser": [
                179
            ],
            "on_AgentSession": [
                180
            ],
            "on_AgentActivity": [
                184
            ],
            "on_AgentSessionToPullRequest": [
                198
            ],
            "on_Favorite": [
                210
            ],
            "on_CustomView": [
                215
            ],
            "on_FeedItem": [
                244
            ],
            "on_ViewPreferences": [
                247
            ],
            "on_IssueLabel": [
                250
            ],
            "on_ProjectLabel": [
                253
            ],
            "on_Customer": [
                256
            ],
            "on_CustomerStatus": [
                257
            ],
            "on_CustomerTier": [
                259
            ],
            "on_CustomerNeed": [
                260
            ],
            "on_Attachment": [
                261
            ],
            "on_ProjectAttachment": [
                262
            ],
            "on_Integration": [
                263
            ],
            "on_Dashboard": [
                264
            ],
            "on_Release": [
                265
            ],
            "on_ReleasePipeline": [
                266
            ],
            "on_ReleaseStage": [
                270
            ],
            "on_InitiativeToProject": [
                275
            ],
            "on_ProjectHistory": [
                288
            ],
            "on_ProjectRelation": [
                291
            ],
            "on_IssueHistory": [
                299
            ],
            "on_IssueImport": [
                301
            ],
            "on_WorkflowDefinition": [
                305
            ],
            "on_IssueRelation": [
                312
            ],
            "on_IssueSuggestion": [
                317
            ],
            "on_TriageResponsibility": [
                327
            ],
            "on_TimeSchedule": [
                330
            ],
            "on_TeamMembership": [
                332
            ],
            "on_GitAutomationState": [
                339
            ],
            "on_GitAutomationTargetBranch": [
                340
            ],
            "on_Webhook": [
                346
            ],
            "on_PaidSubscription": [
                355
            ],
            "on_IdentityProvider": [
                356
            ],
            "on_IssueDraft": [
                360
            ],
            "on_Draft": [
                363
            ],
            "on_CustomViewNotificationSubscription": [
                366
            ],
            "on_CycleNotificationSubscription": [
                367
            ],
            "on_LabelNotificationSubscription": [
                368
            ],
            "on_ProjectNotificationSubscription": [
                369
            ],
            "on_InitiativeNotificationSubscription": [
                370
            ],
            "on_TeamNotificationSubscription": [
                371
            ],
            "on_UserNotificationSubscription": [
                372
            ],
            "on_IssueNotification": [
                373
            ],
            "on_ProjectNotification": [
                376
            ],
            "on_InitiativeNotification": [
                377
            ],
            "on_OauthClientApprovalNotification": [
                378
            ],
            "on_OauthClientApproval": [
                379
            ],
            "on_DocumentNotification": [
                381
            ],
            "on_PostNotification": [
                382
            ],
            "on_CustomerNeedNotification": [
                383
            ],
            "on_CustomerNotification": [
                384
            ],
            "on_PullRequestNotification": [
                385
            ],
            "on_WelcomeMessageNotification": [
                386
            ],
            "on_UserSettings": [
                388
            ],
            "on_SemanticSearchResult": [
                412
            ],
            "on_DocumentSearchResult": [
                417
            ],
            "on_ProjectSearchResult": [
                421
            ],
            "on_IssueSearchResult": [
                424
            ],
            "on_RoadmapToProject": [
                427
            ],
            "on_Roadmap": [
                428
            ],
            "on_OrganizationInvite": [
                444
            ],
            "on_IssueToRelease": [
                458
            ],
            "on_IntegrationTemplate": [
                469
            ],
            "on_InitiativeRelation": [
                475
            ],
            "on_Emoji": [
                481
            ],
            "on_EmailIntakeAddress": [
                482
            ],
            "on_SesDomainIdentity": [
                484
            ],
            "on_AuditEntry": [
                523
            ],
            "on_PushSubscription": [
                626
            ],
            "on_OrganizationDomain": [
                667
            ],
            "__typename": [
                7
            ]
        },
        "ID": {},
        "DateTime": {},
        "User": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "displayName": [
                7
            ],
            "email": [
                7
            ],
            "avatarUrl": [
                7
            ],
            "disableReason": [
                7
            ],
            "calendarHash": [
                7
            ],
            "description": [
                7
            ],
            "statusEmoji": [
                7
            ],
            "statusLabel": [
                7
            ],
            "statusUntilAt": [
                5
            ],
            "timezone": [
                7
            ],
            "organization": [
                8
            ],
            "lastSeen": [
                5
            ],
            "identityProvider": [
                356
            ],
            "initials": [
                7
            ],
            "avatarBackgroundColor": [
                7
            ],
            "guest": [
                12
            ],
            "app": [
                12
            ],
            "isMentionable": [
                12
            ],
            "isAssignable": [
                12
            ],
            "active": [
                12
            ],
            "issueDrafts": [
                358,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "drafts": [
                361,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "url": [
                7
            ],
            "assignedIssues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "delegatedIssues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "createdIssues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "createdIssueCount": [
                105
            ],
            "teams": [
                276,
                {
                    "filter": [
                        51
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "teamMemberships": [
                333,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "feedFacets": [
                364,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "canAccessAnyPublicTeam": [
                12
            ],
            "isMe": [
                12
            ],
            "admin": [
                12
            ],
            "owner": [
                12
            ],
            "supportsAgentSessions": [
                12
            ],
            "inviteHash": [
                7
            ],
            "gitHubUserId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "String": {},
        "Organization": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "urlKey": [
                7
            ],
            "logoUrl": [
                7
            ],
            "periodUploadVolume": [
                9
            ],
            "facets": [
                10
            ],
            "gitBranchFormat": [
                7
            ],
            "gitLinkbackMessagesEnabled": [
                12
            ],
            "gitPublicLinkbackMessagesEnabled": [
                12
            ],
            "gitLinkbackDescriptionsEnabled": [
                12
            ],
            "roadmapEnabled": [
                12
            ],
            "projectUpdateReminderFrequencyInWeeks": [
                9
            ],
            "projectUpdateRemindersDay": [
                112
            ],
            "projectUpdateRemindersHour": [
                9
            ],
            "initiativeUpdateReminderFrequencyInWeeks": [
                9
            ],
            "initiativeUpdateRemindersDay": [
                112
            ],
            "initiativeUpdateRemindersHour": [
                9
            ],
            "fiscalYearStartMonth": [
                9
            ],
            "workingDays": [
                9
            ],
            "samlEnabled": [
                12
            ],
            "samlSettings": [
                18
            ],
            "scimEnabled": [
                12
            ],
            "scimSettings": [
                18
            ],
            "securitySettings": [
                18
            ],
            "allowedAuthServices": [
                7
            ],
            "allowedFileUploadContentTypes": [
                7
            ],
            "ipRestrictions": [
                349
            ],
            "deletionRequestedAt": [
                5
            ],
            "trialEndsAt": [
                5
            ],
            "trialStartsAt": [
                5
            ],
            "previousUrlKeys": [
                7
            ],
            "hipaaComplianceEnabled": [
                12
            ],
            "themeSettings": [
                18
            ],
            "releaseChannel": [
                350
            ],
            "customersConfiguration": [
                18
            ],
            "codeIntelligenceEnabled": [
                12
            ],
            "codeIntelligenceRepository": [
                7
            ],
            "defaultFeedSummarySchedule": [
                178
            ],
            "feedEnabled": [
                12
            ],
            "hideNonPrimaryOrganizations": [
                12
            ],
            "aiAddonEnabled": [
                12
            ],
            "generatedUpdatesEnabled": [
                12
            ],
            "aiThreadSummariesEnabled": [
                12
            ],
            "aiDiscussionSummariesEnabled": [
                12
            ],
            "aiProviderConfiguration": [
                18
            ],
            "linearAgentEnabled": [
                12
            ],
            "slaDayCount": [
                351
            ],
            "projectUpdatesReminderFrequency": [
                352
            ],
            "allowedAiProviders": [
                7
            ],
            "users": [
                278,
                {
                    "includeDisabled": [
                        12
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "teams": [
                276,
                {
                    "filter": [
                        51
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectStatuses": [
                113
            ],
            "integrations": [
                353,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "slackProjectChannelIntegration": [
                263
            ],
            "slackProjectChannelPrefix": [
                7
            ],
            "subscription": [
                355
            ],
            "userCount": [
                105
            ],
            "createdIssueCount": [
                105
            ],
            "templates": [
                342,
                {
                    "filter": [
                        40
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "labels": [
                251,
                {
                    "filter": [
                        47
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectLabels": [
                254,
                {
                    "filter": [
                        57
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "customerCount": [
                105
            ],
            "customersEnabled": [
                12
            ],
            "allowMembersToInvite": [
                12
            ],
            "restrictTeamCreationToAdmins": [
                12
            ],
            "restrictLabelManagementToAdmins": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "Float": {},
        "Facet": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "sortOrder": [
                9
            ],
            "sourceOrganization": [
                8
            ],
            "sourceTeam": [
                11
            ],
            "sourceProject": [
                110
            ],
            "sourceInitiative": [
                129
            ],
            "sourceFeedUser": [
                6
            ],
            "sourcePage": [
                348
            ],
            "targetCustomView": [
                215
            ],
            "__typename": [
                7
            ]
        },
        "Team": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "key": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "retiredAt": [
                5
            ],
            "organization": [
                8
            ],
            "parent": [
                11
            ],
            "children": [
                11
            ],
            "cyclesEnabled": [
                12
            ],
            "cycleStartDay": [
                9
            ],
            "cycleDuration": [
                9
            ],
            "cycleCooldownTime": [
                9
            ],
            "cycleIssueAutoAssignStarted": [
                12
            ],
            "cycleIssueAutoAssignCompleted": [
                12
            ],
            "cycleLockToActive": [
                12
            ],
            "upcomingCycleCount": [
                9
            ],
            "timezone": [
                7
            ],
            "inheritWorkflowStatuses": [
                12
            ],
            "inheritIssueEstimation": [
                12
            ],
            "issueEstimationType": [
                7
            ],
            "issueOrderingNoPriorityFirst": [
                12
            ],
            "issueEstimationAllowZero": [
                12
            ],
            "setIssueSortOrderOnStateChange": [
                7
            ],
            "issueEstimationExtended": [
                12
            ],
            "defaultIssueEstimate": [
                9
            ],
            "triageEnabled": [
                12
            ],
            "requirePriorityToLeaveTriage": [
                12
            ],
            "defaultIssueState": [
                13
            ],
            "defaultTemplateForMembers": [
                116
            ],
            "defaultTemplateForMembersId": [
                7
            ],
            "defaultTemplateForNonMembers": [
                116
            ],
            "defaultTemplateForNonMembersId": [
                7
            ],
            "defaultProjectTemplate": [
                116
            ],
            "triageIssueState": [
                13
            ],
            "private": [
                12
            ],
            "allMembersCanJoin": [
                12
            ],
            "securitySettings": [
                18
            ],
            "facets": [
                10
            ],
            "posts": [
                176
            ],
            "scimManaged": [
                12
            ],
            "scimGroupName": [
                7
            ],
            "progressHistory": [
                18
            ],
            "currentProgress": [
                18
            ],
            "draftWorkflowState": [
                13
            ],
            "startWorkflowState": [
                13
            ],
            "reviewWorkflowState": [
                13
            ],
            "mergeableWorkflowState": [
                13
            ],
            "mergeWorkflowState": [
                13
            ],
            "groupIssueHistory": [
                12
            ],
            "aiThreadSummariesEnabled": [
                12
            ],
            "aiDiscussionSummariesEnabled": [
                12
            ],
            "slackNewIssue": [
                12
            ],
            "slackIssueComments": [
                12
            ],
            "slackIssueStatuses": [
                12
            ],
            "autoClosePeriod": [
                9
            ],
            "autoCloseStateId": [
                7
            ],
            "autoArchivePeriod": [
                9
            ],
            "autoCloseParentIssues": [
                12
            ],
            "autoCloseChildIssues": [
                12
            ],
            "markedAsDuplicateWorkflowState": [
                13
            ],
            "joinByDefault": [
                12
            ],
            "cycleCalenderUrl": [
                7
            ],
            "displayName": [
                7
            ],
            "issues": [
                14,
                {
                    "includeSubTeams": [
                        12
                    ],
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issueCount": [
                105,
                {
                    "includeArchived": [
                        12
                    ]
                }
            ],
            "cycles": [
                324,
                {
                    "filter": [
                        326
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "activeCycle": [
                21
            ],
            "triageResponsibility": [
                327
            ],
            "members": [
                278,
                {
                    "filter": [
                        49
                    ],
                    "includeDisabled": [
                        12
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "membership": [
                332,
                {
                    "userId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "memberships": [
                333,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projects": [
                136,
                {
                    "includeSubTeams": [
                        12
                    ],
                    "filter": [
                        73
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        138,
                        "[ProjectSortInput!]"
                    ]
                }
            ],
            "states": [
                335,
                {
                    "filter": [
                        91
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "gitAutomationStates": [
                337,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "templates": [
                342,
                {
                    "filter": [
                        40
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "labels": [
                251,
                {
                    "filter": [
                        47
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "webhooks": [
                344,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "integrationsSettings": [
                154
            ],
            "issueSortOrderDefaultToBottom": [
                12
            ],
            "inviteHash": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Boolean": {},
        "WorkflowState": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "type": [
                7
            ],
            "team": [
                11
            ],
            "inheritedFrom": [
                13
            ],
            "issues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "IssueConnection": {
            "edges": [
                15
            ],
            "nodes": [
                16
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueEdge": {
            "node": [
                16
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Issue": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "number": [
                9
            ],
            "title": [
                7
            ],
            "priority": [
                9
            ],
            "estimate": [
                9
            ],
            "boardOrder": [
                9
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "startedAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "startedTriageAt": [
                5
            ],
            "triagedAt": [
                5
            ],
            "canceledAt": [
                5
            ],
            "autoClosedAt": [
                5
            ],
            "autoArchivedAt": [
                5
            ],
            "dueDate": [
                17
            ],
            "slaStartedAt": [
                5
            ],
            "slaMediumRiskAt": [
                5
            ],
            "slaHighRiskAt": [
                5
            ],
            "slaBreachesAt": [
                5
            ],
            "slaType": [
                7
            ],
            "addedToProjectAt": [
                5
            ],
            "addedToCycleAt": [
                5
            ],
            "addedToTeamAt": [
                5
            ],
            "trashed": [
                12
            ],
            "snoozedUntilAt": [
                5
            ],
            "suggestionsGeneratedAt": [
                5
            ],
            "activitySummary": [
                18
            ],
            "summary": [
                19
            ],
            "labelIds": [
                7
            ],
            "team": [
                11
            ],
            "cycle": [
                21
            ],
            "project": [
                110
            ],
            "projectMilestone": [
                172
            ],
            "lastAppliedTemplate": [
                116
            ],
            "recurringIssueTemplate": [
                116
            ],
            "previousIdentifiers": [
                7
            ],
            "creator": [
                6
            ],
            "externalUserCreator": [
                179
            ],
            "assignee": [
                6
            ],
            "delegate": [
                6
            ],
            "snoozedBy": [
                6
            ],
            "state": [
                13
            ],
            "subIssueSortOrder": [
                9
            ],
            "reactionData": [
                18
            ],
            "priorityLabel": [
                7
            ],
            "sourceComment": [
                121
            ],
            "integrationSourceType": [
                294
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "botActor": [
                202
            ],
            "favorite": [
                210
            ],
            "identifier": [
                7
            ],
            "url": [
                7
            ],
            "branchName": [
                7
            ],
            "sharedAccess": [
                295
            ],
            "customerTicketCount": [
                105
            ],
            "subscribers": [
                278,
                {
                    "filter": [
                        49
                    ],
                    "includeDisabled": [
                        12
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "parent": [
                16
            ],
            "children": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "history": [
                297,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "labels": [
                251,
                {
                    "filter": [
                        47
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "relations": [
                310,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "inverseRelations": [
                310,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "attachments": [
                313,
                {
                    "filter": [
                        94
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "formerAttachments": [
                313,
                {
                    "filter": [
                        94
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "description": [
                7
            ],
            "descriptionState": [
                7
            ],
            "documentContent": [
                122
            ],
            "reactions": [
                120
            ],
            "needs": [
                292,
                {
                    "filter": [
                        83
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "formerNeeds": [
                292,
                {
                    "filter": [
                        83
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "syncedWith": [
                204
            ],
            "suggestions": [
                315,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "incomingSuggestions": [
                315,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "asksRequester": [
                6
            ],
            "asksExternalUserRequester": [
                179
            ],
            "stateHistory": [
                321,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "TimelessDate": {},
        "JSONObject": {},
        "Summary": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "issue": [
                16
            ],
            "content": [
                18
            ],
            "evalLogId": [
                7
            ],
            "generationStatus": [
                20
            ],
            "generatedAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "SummaryGenerationStatus": {},
        "Cycle": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "number": [
                9
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "startsAt": [
                5
            ],
            "endsAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "autoArchivedAt": [
                5
            ],
            "issueCountHistory": [
                9
            ],
            "completedIssueCountHistory": [
                9
            ],
            "scopeHistory": [
                9
            ],
            "completedScopeHistory": [
                9
            ],
            "inProgressScopeHistory": [
                9
            ],
            "team": [
                11
            ],
            "progressHistory": [
                18
            ],
            "currentProgress": [
                18
            ],
            "inheritedFrom": [
                21
            ],
            "isActive": [
                12
            ],
            "isFuture": [
                12
            ],
            "isPast": [
                12
            ],
            "issues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "uncompletedIssuesUponClose": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "progress": [
                9
            ],
            "isNext": [
                12
            ],
            "isPrevious": [
                12
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "links": [
                151,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "IssueFilter": {
            "id": [
                23
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "number": [
                26
            ],
            "title": [
                27
            ],
            "description": [
                28
            ],
            "priority": [
                29
            ],
            "estimate": [
                30
            ],
            "startedAt": [
                31
            ],
            "triagedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "canceledAt": [
                31
            ],
            "archivedAt": [
                31
            ],
            "autoClosedAt": [
                31
            ],
            "autoArchivedAt": [
                31
            ],
            "addedToCycleAt": [
                31
            ],
            "addedToCyclePeriod": [
                32
            ],
            "dueDate": [
                34
            ],
            "accumulatedStateUpdatedAt": [
                31
            ],
            "snoozedUntilAt": [
                31
            ],
            "assignee": [
                36
            ],
            "delegate": [
                36
            ],
            "lastAppliedTemplate": [
                40
            ],
            "recurringIssueTemplate": [
                40
            ],
            "sourceMetadata": [
                41
            ],
            "creator": [
                36
            ],
            "parent": [
                44
            ],
            "snoozedBy": [
                36
            ],
            "labels": [
                45
            ],
            "subscribers": [
                48
            ],
            "hasSharedUsers": [
                50
            ],
            "sharedWith": [
                48
            ],
            "team": [
                51
            ],
            "projectMilestone": [
                52
            ],
            "comments": [
                84
            ],
            "activity": [
                86
            ],
            "suggestions": [
                88
            ],
            "cycle": [
                90
            ],
            "project": [
                53
            ],
            "state": [
                91
            ],
            "children": [
                39
            ],
            "attachments": [
                92
            ],
            "searchableContent": [
                58
            ],
            "hasRelatedRelations": [
                50
            ],
            "hasDuplicateRelations": [
                50
            ],
            "hasBlockedByRelations": [
                50
            ],
            "hasBlockingRelations": [
                50
            ],
            "hasSuggestedRelatedIssues": [
                50
            ],
            "hasSuggestedSimilarIssues": [
                50
            ],
            "hasSuggestedAssignees": [
                50
            ],
            "hasSuggestedProjects": [
                50
            ],
            "hasSuggestedLabels": [
                50
            ],
            "hasSuggestedTeams": [
                50
            ],
            "slaStatus": [
                95
            ],
            "reactions": [
                74
            ],
            "needs": [
                70
            ],
            "releases": [
                97
            ],
            "customerCount": [
                26
            ],
            "customerImportantCount": [
                26
            ],
            "leadTime": [
                103
            ],
            "cycleTime": [
                103
            ],
            "ageTime": [
                103
            ],
            "triageTime": [
                103
            ],
            "and": [
                22
            ],
            "or": [
                22
            ],
            "__typename": [
                7
            ]
        },
        "IssueIDComparator": {
            "eq": [
                4
            ],
            "neq": [
                4
            ],
            "in": [
                4
            ],
            "nin": [
                4
            ],
            "__typename": [
                7
            ]
        },
        "DateComparator": {
            "eq": [
                25
            ],
            "neq": [
                25
            ],
            "in": [
                25
            ],
            "nin": [
                25
            ],
            "lt": [
                25
            ],
            "lte": [
                25
            ],
            "gt": [
                25
            ],
            "gte": [
                25
            ],
            "__typename": [
                7
            ]
        },
        "DateTimeOrDuration": {},
        "NumberComparator": {
            "eq": [
                9
            ],
            "neq": [
                9
            ],
            "in": [
                9
            ],
            "nin": [
                9
            ],
            "lt": [
                9
            ],
            "lte": [
                9
            ],
            "gt": [
                9
            ],
            "gte": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "StringComparator": {
            "eq": [
                7
            ],
            "neq": [
                7
            ],
            "in": [
                7
            ],
            "nin": [
                7
            ],
            "eqIgnoreCase": [
                7
            ],
            "neqIgnoreCase": [
                7
            ],
            "startsWith": [
                7
            ],
            "startsWithIgnoreCase": [
                7
            ],
            "notStartsWith": [
                7
            ],
            "endsWith": [
                7
            ],
            "notEndsWith": [
                7
            ],
            "contains": [
                7
            ],
            "containsIgnoreCase": [
                7
            ],
            "notContains": [
                7
            ],
            "notContainsIgnoreCase": [
                7
            ],
            "containsIgnoreCaseAndAccent": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NullableStringComparator": {
            "eq": [
                7
            ],
            "neq": [
                7
            ],
            "in": [
                7
            ],
            "nin": [
                7
            ],
            "null": [
                12
            ],
            "eqIgnoreCase": [
                7
            ],
            "neqIgnoreCase": [
                7
            ],
            "startsWith": [
                7
            ],
            "startsWithIgnoreCase": [
                7
            ],
            "notStartsWith": [
                7
            ],
            "endsWith": [
                7
            ],
            "notEndsWith": [
                7
            ],
            "contains": [
                7
            ],
            "containsIgnoreCase": [
                7
            ],
            "notContains": [
                7
            ],
            "notContainsIgnoreCase": [
                7
            ],
            "containsIgnoreCaseAndAccent": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NullableNumberComparator": {
            "eq": [
                9
            ],
            "neq": [
                9
            ],
            "in": [
                9
            ],
            "nin": [
                9
            ],
            "null": [
                12
            ],
            "lt": [
                9
            ],
            "lte": [
                9
            ],
            "gt": [
                9
            ],
            "gte": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "EstimateComparator": {
            "eq": [
                9
            ],
            "neq": [
                9
            ],
            "in": [
                9
            ],
            "nin": [
                9
            ],
            "null": [
                12
            ],
            "lt": [
                9
            ],
            "lte": [
                9
            ],
            "gt": [
                9
            ],
            "gte": [
                9
            ],
            "or": [
                29
            ],
            "and": [
                29
            ],
            "__typename": [
                7
            ]
        },
        "NullableDateComparator": {
            "eq": [
                25
            ],
            "neq": [
                25
            ],
            "in": [
                25
            ],
            "nin": [
                25
            ],
            "null": [
                12
            ],
            "lt": [
                25
            ],
            "lte": [
                25
            ],
            "gt": [
                25
            ],
            "gte": [
                25
            ],
            "__typename": [
                7
            ]
        },
        "CyclePeriodComparator": {
            "eq": [
                33
            ],
            "neq": [
                33
            ],
            "in": [
                33
            ],
            "nin": [
                33
            ],
            "null": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CyclePeriod": {},
        "NullableTimelessDateComparator": {
            "eq": [
                35
            ],
            "neq": [
                35
            ],
            "in": [
                35
            ],
            "nin": [
                35
            ],
            "null": [
                12
            ],
            "lt": [
                35
            ],
            "lte": [
                35
            ],
            "gt": [
                35
            ],
            "gte": [
                35
            ],
            "__typename": [
                7
            ]
        },
        "TimelessDateOrDuration": {},
        "NullableUserFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "displayName": [
                27
            ],
            "email": [
                27
            ],
            "active": [
                38
            ],
            "assignedIssues": [
                39
            ],
            "admin": [
                38
            ],
            "owner": [
                38
            ],
            "invited": [
                38
            ],
            "isInvited": [
                38
            ],
            "app": [
                38
            ],
            "isMe": [
                38
            ],
            "null": [
                12
            ],
            "and": [
                36
            ],
            "or": [
                36
            ],
            "__typename": [
                7
            ]
        },
        "IDComparator": {
            "eq": [
                4
            ],
            "neq": [
                4
            ],
            "in": [
                4
            ],
            "nin": [
                4
            ],
            "__typename": [
                7
            ]
        },
        "BooleanComparator": {
            "eq": [
                12
            ],
            "neq": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueCollectionFilter": {
            "id": [
                23
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "number": [
                26
            ],
            "title": [
                27
            ],
            "description": [
                28
            ],
            "priority": [
                29
            ],
            "estimate": [
                30
            ],
            "startedAt": [
                31
            ],
            "triagedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "canceledAt": [
                31
            ],
            "archivedAt": [
                31
            ],
            "autoClosedAt": [
                31
            ],
            "autoArchivedAt": [
                31
            ],
            "addedToCycleAt": [
                31
            ],
            "addedToCyclePeriod": [
                32
            ],
            "dueDate": [
                34
            ],
            "accumulatedStateUpdatedAt": [
                31
            ],
            "snoozedUntilAt": [
                31
            ],
            "assignee": [
                36
            ],
            "delegate": [
                36
            ],
            "lastAppliedTemplate": [
                40
            ],
            "recurringIssueTemplate": [
                40
            ],
            "sourceMetadata": [
                41
            ],
            "creator": [
                36
            ],
            "parent": [
                44
            ],
            "snoozedBy": [
                36
            ],
            "labels": [
                45
            ],
            "subscribers": [
                48
            ],
            "hasSharedUsers": [
                50
            ],
            "sharedWith": [
                48
            ],
            "team": [
                51
            ],
            "projectMilestone": [
                52
            ],
            "comments": [
                84
            ],
            "activity": [
                86
            ],
            "suggestions": [
                88
            ],
            "cycle": [
                90
            ],
            "project": [
                53
            ],
            "state": [
                91
            ],
            "children": [
                39
            ],
            "attachments": [
                92
            ],
            "searchableContent": [
                58
            ],
            "hasRelatedRelations": [
                50
            ],
            "hasDuplicateRelations": [
                50
            ],
            "hasBlockedByRelations": [
                50
            ],
            "hasBlockingRelations": [
                50
            ],
            "hasSuggestedRelatedIssues": [
                50
            ],
            "hasSuggestedSimilarIssues": [
                50
            ],
            "hasSuggestedAssignees": [
                50
            ],
            "hasSuggestedProjects": [
                50
            ],
            "hasSuggestedLabels": [
                50
            ],
            "hasSuggestedTeams": [
                50
            ],
            "slaStatus": [
                95
            ],
            "reactions": [
                74
            ],
            "needs": [
                70
            ],
            "releases": [
                97
            ],
            "customerCount": [
                26
            ],
            "customerImportantCount": [
                26
            ],
            "leadTime": [
                103
            ],
            "cycleTime": [
                103
            ],
            "ageTime": [
                103
            ],
            "triageTime": [
                103
            ],
            "and": [
                39
            ],
            "or": [
                39
            ],
            "some": [
                22
            ],
            "every": [
                22
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "NullableTemplateFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "type": [
                27
            ],
            "inheritedFromId": [
                37
            ],
            "null": [
                12
            ],
            "and": [
                40
            ],
            "or": [
                40
            ],
            "__typename": [
                7
            ]
        },
        "SourceMetadataComparator": {
            "eq": [
                7
            ],
            "neq": [
                7
            ],
            "in": [
                7
            ],
            "nin": [
                7
            ],
            "null": [
                12
            ],
            "subType": [
                42
            ],
            "salesforceMetadata": [
                43
            ],
            "__typename": [
                7
            ]
        },
        "SubTypeComparator": {
            "eq": [
                7
            ],
            "neq": [
                7
            ],
            "in": [
                7
            ],
            "nin": [
                7
            ],
            "null": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SalesforceMetadataIntegrationComparator": {
            "caseMetadata": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "NullableIssueFilter": {
            "id": [
                23
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "number": [
                26
            ],
            "title": [
                27
            ],
            "description": [
                28
            ],
            "priority": [
                29
            ],
            "estimate": [
                30
            ],
            "startedAt": [
                31
            ],
            "triagedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "canceledAt": [
                31
            ],
            "archivedAt": [
                31
            ],
            "autoClosedAt": [
                31
            ],
            "autoArchivedAt": [
                31
            ],
            "addedToCycleAt": [
                31
            ],
            "addedToCyclePeriod": [
                32
            ],
            "dueDate": [
                34
            ],
            "accumulatedStateUpdatedAt": [
                31
            ],
            "snoozedUntilAt": [
                31
            ],
            "assignee": [
                36
            ],
            "delegate": [
                36
            ],
            "lastAppliedTemplate": [
                40
            ],
            "recurringIssueTemplate": [
                40
            ],
            "sourceMetadata": [
                41
            ],
            "creator": [
                36
            ],
            "parent": [
                44
            ],
            "snoozedBy": [
                36
            ],
            "labels": [
                45
            ],
            "subscribers": [
                48
            ],
            "hasSharedUsers": [
                50
            ],
            "sharedWith": [
                48
            ],
            "team": [
                51
            ],
            "projectMilestone": [
                52
            ],
            "comments": [
                84
            ],
            "activity": [
                86
            ],
            "suggestions": [
                88
            ],
            "cycle": [
                90
            ],
            "project": [
                53
            ],
            "state": [
                91
            ],
            "children": [
                39
            ],
            "attachments": [
                92
            ],
            "searchableContent": [
                58
            ],
            "hasRelatedRelations": [
                50
            ],
            "hasDuplicateRelations": [
                50
            ],
            "hasBlockedByRelations": [
                50
            ],
            "hasBlockingRelations": [
                50
            ],
            "hasSuggestedRelatedIssues": [
                50
            ],
            "hasSuggestedSimilarIssues": [
                50
            ],
            "hasSuggestedAssignees": [
                50
            ],
            "hasSuggestedProjects": [
                50
            ],
            "hasSuggestedLabels": [
                50
            ],
            "hasSuggestedTeams": [
                50
            ],
            "slaStatus": [
                95
            ],
            "reactions": [
                74
            ],
            "needs": [
                70
            ],
            "releases": [
                97
            ],
            "customerCount": [
                26
            ],
            "customerImportantCount": [
                26
            ],
            "leadTime": [
                103
            ],
            "cycleTime": [
                103
            ],
            "ageTime": [
                103
            ],
            "triageTime": [
                103
            ],
            "null": [
                12
            ],
            "and": [
                44
            ],
            "or": [
                44
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabelCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "isGroup": [
                38
            ],
            "creator": [
                36
            ],
            "team": [
                46
            ],
            "parent": [
                47
            ],
            "null": [
                12
            ],
            "and": [
                45
            ],
            "or": [
                45
            ],
            "some": [
                47
            ],
            "every": [
                47
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "NullableTeamFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "key": [
                27
            ],
            "description": [
                28
            ],
            "private": [
                38
            ],
            "issues": [
                39
            ],
            "parent": [
                46
            ],
            "null": [
                12
            ],
            "and": [
                46
            ],
            "or": [
                46
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabelFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "isGroup": [
                38
            ],
            "creator": [
                36
            ],
            "team": [
                46
            ],
            "parent": [
                47
            ],
            "and": [
                47
            ],
            "or": [
                47
            ],
            "__typename": [
                7
            ]
        },
        "UserCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "displayName": [
                27
            ],
            "email": [
                27
            ],
            "active": [
                38
            ],
            "assignedIssues": [
                39
            ],
            "admin": [
                38
            ],
            "owner": [
                38
            ],
            "invited": [
                38
            ],
            "isInvited": [
                38
            ],
            "app": [
                38
            ],
            "isMe": [
                38
            ],
            "and": [
                48
            ],
            "or": [
                48
            ],
            "some": [
                49
            ],
            "every": [
                49
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "UserFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "displayName": [
                27
            ],
            "email": [
                27
            ],
            "active": [
                38
            ],
            "assignedIssues": [
                39
            ],
            "admin": [
                38
            ],
            "owner": [
                38
            ],
            "invited": [
                38
            ],
            "isInvited": [
                38
            ],
            "app": [
                38
            ],
            "isMe": [
                38
            ],
            "and": [
                49
            ],
            "or": [
                49
            ],
            "__typename": [
                7
            ]
        },
        "RelationExistsComparator": {
            "eq": [
                12
            ],
            "neq": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "TeamFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "key": [
                27
            ],
            "description": [
                28
            ],
            "private": [
                38
            ],
            "issues": [
                39
            ],
            "parent": [
                46
            ],
            "and": [
                51
            ],
            "or": [
                51
            ],
            "__typename": [
                7
            ]
        },
        "NullableProjectMilestoneFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                28
            ],
            "targetDate": [
                31
            ],
            "project": [
                53
            ],
            "null": [
                12
            ],
            "and": [
                52
            ],
            "or": [
                52
            ],
            "__typename": [
                7
            ]
        },
        "NullableProjectFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slugId": [
                27
            ],
            "state": [
                27
            ],
            "status": [
                54
            ],
            "priority": [
                29
            ],
            "labels": [
                56
            ],
            "searchableContent": [
                58
            ],
            "startedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "canceledAt": [
                31
            ],
            "startDate": [
                31
            ],
            "targetDate": [
                31
            ],
            "health": [
                27
            ],
            "healthWithAge": [
                27
            ],
            "activityType": [
                27
            ],
            "hasRelatedRelations": [
                50
            ],
            "hasDependedOnByRelations": [
                50
            ],
            "hasDependsOnRelations": [
                50
            ],
            "hasBlockedByRelations": [
                50
            ],
            "hasBlockingRelations": [
                50
            ],
            "hasViolatedRelations": [
                50
            ],
            "projectUpdates": [
                59
            ],
            "creator": [
                49
            ],
            "lead": [
                36
            ],
            "members": [
                48
            ],
            "issues": [
                39
            ],
            "roadmaps": [
                61
            ],
            "initiatives": [
                63
            ],
            "projectMilestones": [
                68
            ],
            "completedProjectMilestones": [
                68
            ],
            "nextProjectMilestone": [
                69
            ],
            "accessibleTeams": [
                64
            ],
            "lastAppliedTemplate": [
                40
            ],
            "needs": [
                70
            ],
            "customerCount": [
                26
            ],
            "customerImportantCount": [
                26
            ],
            "null": [
                12
            ],
            "and": [
                53
            ],
            "or": [
                53
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "description": [
                27
            ],
            "position": [
                26
            ],
            "type": [
                27
            ],
            "projects": [
                55
            ],
            "and": [
                54
            ],
            "or": [
                54
            ],
            "__typename": [
                7
            ]
        },
        "ProjectCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slugId": [
                27
            ],
            "state": [
                27
            ],
            "status": [
                54
            ],
            "priority": [
                29
            ],
            "labels": [
                56
            ],
            "searchableContent": [
                58
            ],
            "startedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "canceledAt": [
                31
            ],
            "startDate": [
                31
            ],
            "targetDate": [
                31
            ],
            "health": [
                27
            ],
            "healthWithAge": [
                27
            ],
            "activityType": [
                27
            ],
            "hasRelatedRelations": [
                50
            ],
            "hasDependedOnByRelations": [
                50
            ],
            "hasDependsOnRelations": [
                50
            ],
            "hasBlockedByRelations": [
                50
            ],
            "hasBlockingRelations": [
                50
            ],
            "hasViolatedRelations": [
                50
            ],
            "projectUpdates": [
                59
            ],
            "creator": [
                49
            ],
            "lead": [
                36
            ],
            "members": [
                48
            ],
            "issues": [
                39
            ],
            "roadmaps": [
                61
            ],
            "initiatives": [
                63
            ],
            "projectMilestones": [
                68
            ],
            "completedProjectMilestones": [
                68
            ],
            "nextProjectMilestone": [
                69
            ],
            "accessibleTeams": [
                64
            ],
            "lastAppliedTemplate": [
                40
            ],
            "needs": [
                70
            ],
            "customerCount": [
                26
            ],
            "customerImportantCount": [
                26
            ],
            "and": [
                55
            ],
            "or": [
                55
            ],
            "some": [
                73
            ],
            "every": [
                73
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabelCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "isGroup": [
                38
            ],
            "creator": [
                36
            ],
            "parent": [
                57
            ],
            "null": [
                12
            ],
            "and": [
                56
            ],
            "or": [
                56
            ],
            "some": [
                56
            ],
            "every": [
                57
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabelFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "isGroup": [
                38
            ],
            "creator": [
                36
            ],
            "parent": [
                57
            ],
            "and": [
                57
            ],
            "or": [
                57
            ],
            "__typename": [
                7
            ]
        },
        "ContentComparator": {
            "contains": [
                7
            ],
            "notContains": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdatesCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "health": [
                27
            ],
            "and": [
                59
            ],
            "or": [
                59
            ],
            "some": [
                60
            ],
            "every": [
                60
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdatesFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "health": [
                27
            ],
            "and": [
                60
            ],
            "or": [
                60
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slugId": [
                27
            ],
            "creator": [
                49
            ],
            "and": [
                61
            ],
            "or": [
                61
            ],
            "some": [
                62
            ],
            "every": [
                62
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slugId": [
                27
            ],
            "creator": [
                49
            ],
            "and": [
                62
            ],
            "or": [
                62
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slugId": [
                27
            ],
            "creator": [
                36
            ],
            "status": [
                27
            ],
            "teams": [
                64
            ],
            "owner": [
                36
            ],
            "targetDate": [
                31
            ],
            "startedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "health": [
                27
            ],
            "healthWithAge": [
                27
            ],
            "activityType": [
                27
            ],
            "ancestors": [
                63
            ],
            "initiativeUpdates": [
                65
            ],
            "and": [
                63
            ],
            "or": [
                63
            ],
            "some": [
                67
            ],
            "every": [
                67
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "TeamCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "and": [
                64
            ],
            "or": [
                64
            ],
            "some": [
                51
            ],
            "every": [
                51
            ],
            "length": [
                26
            ],
            "parent": [
                46
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdatesCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "and": [
                65
            ],
            "or": [
                65
            ],
            "some": [
                66
            ],
            "every": [
                66
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdatesFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "and": [
                66
            ],
            "or": [
                66
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slugId": [
                27
            ],
            "creator": [
                36
            ],
            "status": [
                27
            ],
            "teams": [
                64
            ],
            "owner": [
                36
            ],
            "targetDate": [
                31
            ],
            "startedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "health": [
                27
            ],
            "healthWithAge": [
                27
            ],
            "activityType": [
                27
            ],
            "ancestors": [
                63
            ],
            "initiativeUpdates": [
                65
            ],
            "and": [
                67
            ],
            "or": [
                67
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                28
            ],
            "targetDate": [
                31
            ],
            "project": [
                53
            ],
            "and": [
                68
            ],
            "or": [
                68
            ],
            "some": [
                69
            ],
            "every": [
                69
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                28
            ],
            "targetDate": [
                31
            ],
            "project": [
                53
            ],
            "and": [
                69
            ],
            "or": [
                69
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "priority": [
                26
            ],
            "project": [
                53
            ],
            "issue": [
                44
            ],
            "comment": [
                71
            ],
            "customer": [
                78
            ],
            "and": [
                70
            ],
            "or": [
                70
            ],
            "some": [
                83
            ],
            "every": [
                83
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "NullableCommentFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "body": [
                27
            ],
            "user": [
                49
            ],
            "issue": [
                44
            ],
            "projectUpdate": [
                72
            ],
            "parent": [
                71
            ],
            "documentContent": [
                76
            ],
            "reactions": [
                74
            ],
            "needs": [
                70
            ],
            "null": [
                12
            ],
            "and": [
                71
            ],
            "or": [
                71
            ],
            "__typename": [
                7
            ]
        },
        "NullableProjectUpdateFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "user": [
                49
            ],
            "project": [
                73
            ],
            "reactions": [
                74
            ],
            "null": [
                12
            ],
            "and": [
                72
            ],
            "or": [
                72
            ],
            "__typename": [
                7
            ]
        },
        "ProjectFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slugId": [
                27
            ],
            "state": [
                27
            ],
            "status": [
                54
            ],
            "priority": [
                29
            ],
            "labels": [
                56
            ],
            "searchableContent": [
                58
            ],
            "startedAt": [
                31
            ],
            "completedAt": [
                31
            ],
            "canceledAt": [
                31
            ],
            "startDate": [
                31
            ],
            "targetDate": [
                31
            ],
            "health": [
                27
            ],
            "healthWithAge": [
                27
            ],
            "activityType": [
                27
            ],
            "hasRelatedRelations": [
                50
            ],
            "hasDependedOnByRelations": [
                50
            ],
            "hasDependsOnRelations": [
                50
            ],
            "hasBlockedByRelations": [
                50
            ],
            "hasBlockingRelations": [
                50
            ],
            "hasViolatedRelations": [
                50
            ],
            "projectUpdates": [
                59
            ],
            "creator": [
                49
            ],
            "lead": [
                36
            ],
            "members": [
                48
            ],
            "issues": [
                39
            ],
            "roadmaps": [
                61
            ],
            "initiatives": [
                63
            ],
            "projectMilestones": [
                68
            ],
            "completedProjectMilestones": [
                68
            ],
            "nextProjectMilestone": [
                69
            ],
            "accessibleTeams": [
                64
            ],
            "lastAppliedTemplate": [
                40
            ],
            "needs": [
                70
            ],
            "customerCount": [
                26
            ],
            "customerImportantCount": [
                26
            ],
            "and": [
                73
            ],
            "or": [
                73
            ],
            "__typename": [
                7
            ]
        },
        "ReactionCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "emoji": [
                27
            ],
            "customEmojiId": [
                37
            ],
            "and": [
                74
            ],
            "or": [
                74
            ],
            "some": [
                75
            ],
            "every": [
                75
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "ReactionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "emoji": [
                27
            ],
            "customEmojiId": [
                37
            ],
            "and": [
                75
            ],
            "or": [
                75
            ],
            "__typename": [
                7
            ]
        },
        "NullableDocumentContentFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "content": [
                28
            ],
            "project": [
                73
            ],
            "document": [
                77
            ],
            "null": [
                12
            ],
            "and": [
                76
            ],
            "or": [
                76
            ],
            "__typename": [
                7
            ]
        },
        "DocumentFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "title": [
                27
            ],
            "slugId": [
                27
            ],
            "creator": [
                49
            ],
            "project": [
                73
            ],
            "issue": [
                22
            ],
            "initiative": [
                67
            ],
            "and": [
                77
            ],
            "or": [
                77
            ],
            "__typename": [
                7
            ]
        },
        "NullableCustomerFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slackChannelId": [
                27
            ],
            "domains": [
                79
            ],
            "externalIds": [
                79
            ],
            "owner": [
                36
            ],
            "needs": [
                70
            ],
            "revenue": [
                26
            ],
            "size": [
                26
            ],
            "status": [
                81
            ],
            "tier": [
                82
            ],
            "null": [
                12
            ],
            "and": [
                78
            ],
            "or": [
                78
            ],
            "__typename": [
                7
            ]
        },
        "StringArrayComparator": {
            "length": [
                26
            ],
            "every": [
                80
            ],
            "some": [
                80
            ],
            "__typename": [
                7
            ]
        },
        "StringItemComparator": {
            "eq": [
                7
            ],
            "neq": [
                7
            ],
            "in": [
                7
            ],
            "nin": [
                7
            ],
            "eqIgnoreCase": [
                7
            ],
            "neqIgnoreCase": [
                7
            ],
            "startsWith": [
                7
            ],
            "startsWithIgnoreCase": [
                7
            ],
            "notStartsWith": [
                7
            ],
            "endsWith": [
                7
            ],
            "notEndsWith": [
                7
            ],
            "contains": [
                7
            ],
            "containsIgnoreCase": [
                7
            ],
            "notContains": [
                7
            ],
            "notContainsIgnoreCase": [
                7
            ],
            "containsIgnoreCaseAndAccent": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "description": [
                27
            ],
            "position": [
                26
            ],
            "type": [
                27
            ],
            "color": [
                27
            ],
            "and": [
                81
            ],
            "or": [
                81
            ],
            "__typename": [
                7
            ]
        },
        "CustomerTierFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "displayName": [
                27
            ],
            "description": [
                27
            ],
            "position": [
                26
            ],
            "color": [
                27
            ],
            "and": [
                82
            ],
            "or": [
                82
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "priority": [
                26
            ],
            "project": [
                53
            ],
            "issue": [
                44
            ],
            "comment": [
                71
            ],
            "customer": [
                78
            ],
            "and": [
                83
            ],
            "or": [
                83
            ],
            "__typename": [
                7
            ]
        },
        "CommentCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "body": [
                27
            ],
            "user": [
                49
            ],
            "issue": [
                44
            ],
            "projectUpdate": [
                72
            ],
            "parent": [
                71
            ],
            "documentContent": [
                76
            ],
            "reactions": [
                74
            ],
            "needs": [
                70
            ],
            "and": [
                84
            ],
            "or": [
                84
            ],
            "some": [
                85
            ],
            "every": [
                85
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "CommentFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "body": [
                27
            ],
            "user": [
                49
            ],
            "issue": [
                44
            ],
            "projectUpdate": [
                72
            ],
            "parent": [
                71
            ],
            "documentContent": [
                76
            ],
            "reactions": [
                74
            ],
            "needs": [
                70
            ],
            "and": [
                85
            ],
            "or": [
                85
            ],
            "__typename": [
                7
            ]
        },
        "ActivityCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "user": [
                49
            ],
            "and": [
                86
            ],
            "or": [
                86
            ],
            "some": [
                87
            ],
            "every": [
                87
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "ActivityFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "user": [
                49
            ],
            "and": [
                87
            ],
            "or": [
                87
            ],
            "__typename": [
                7
            ]
        },
        "IssueSuggestionCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "type": [
                27
            ],
            "state": [
                27
            ],
            "suggestedUser": [
                36
            ],
            "suggestedProject": [
                53
            ],
            "suggestedTeam": [
                46
            ],
            "suggestedLabel": [
                47
            ],
            "and": [
                88
            ],
            "or": [
                88
            ],
            "some": [
                89
            ],
            "every": [
                89
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "IssueSuggestionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "type": [
                27
            ],
            "state": [
                27
            ],
            "suggestedUser": [
                36
            ],
            "suggestedProject": [
                53
            ],
            "suggestedTeam": [
                46
            ],
            "suggestedLabel": [
                47
            ],
            "and": [
                89
            ],
            "or": [
                89
            ],
            "__typename": [
                7
            ]
        },
        "NullableCycleFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "number": [
                26
            ],
            "name": [
                27
            ],
            "startsAt": [
                24
            ],
            "endsAt": [
                24
            ],
            "completedAt": [
                24
            ],
            "isActive": [
                38
            ],
            "isInCooldown": [
                38
            ],
            "isNext": [
                38
            ],
            "isPrevious": [
                38
            ],
            "isFuture": [
                38
            ],
            "isPast": [
                38
            ],
            "team": [
                51
            ],
            "issues": [
                39
            ],
            "inheritedFromId": [
                37
            ],
            "null": [
                12
            ],
            "and": [
                90
            ],
            "or": [
                90
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStateFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "description": [
                27
            ],
            "position": [
                26
            ],
            "type": [
                27
            ],
            "team": [
                51
            ],
            "issues": [
                39
            ],
            "and": [
                91
            ],
            "or": [
                91
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "title": [
                27
            ],
            "subtitle": [
                28
            ],
            "url": [
                27
            ],
            "creator": [
                36
            ],
            "sourceType": [
                93
            ],
            "and": [
                92
            ],
            "or": [
                92
            ],
            "some": [
                94
            ],
            "every": [
                94
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "SourceTypeComparator": {
            "eq": [
                7
            ],
            "neq": [
                7
            ],
            "in": [
                7
            ],
            "nin": [
                7
            ],
            "eqIgnoreCase": [
                7
            ],
            "neqIgnoreCase": [
                7
            ],
            "startsWith": [
                7
            ],
            "startsWithIgnoreCase": [
                7
            ],
            "notStartsWith": [
                7
            ],
            "endsWith": [
                7
            ],
            "notEndsWith": [
                7
            ],
            "contains": [
                7
            ],
            "containsIgnoreCase": [
                7
            ],
            "notContains": [
                7
            ],
            "notContainsIgnoreCase": [
                7
            ],
            "containsIgnoreCaseAndAccent": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "title": [
                27
            ],
            "subtitle": [
                28
            ],
            "url": [
                27
            ],
            "creator": [
                36
            ],
            "sourceType": [
                93
            ],
            "and": [
                94
            ],
            "or": [
                94
            ],
            "__typename": [
                7
            ]
        },
        "SlaStatusComparator": {
            "eq": [
                96
            ],
            "neq": [
                96
            ],
            "in": [
                96
            ],
            "nin": [
                96
            ],
            "null": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SlaStatus": {},
        "ReleaseCollectionFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "version": [
                27
            ],
            "pipeline": [
                98
            ],
            "stage": [
                99
            ],
            "and": [
                97
            ],
            "or": [
                97
            ],
            "some": [
                102
            ],
            "every": [
                102
            ],
            "length": [
                26
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelineFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "and": [
                98
            ],
            "or": [
                98
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStageFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "type": [
                100
            ],
            "name": [
                27
            ],
            "and": [
                99
            ],
            "or": [
                99
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStageTypeComparator": {
            "eq": [
                101
            ],
            "neq": [
                101
            ],
            "in": [
                101
            ],
            "nin": [
                101
            ],
            "null": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStageType": {},
        "ReleaseFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "version": [
                27
            ],
            "pipeline": [
                98
            ],
            "stage": [
                99
            ],
            "and": [
                102
            ],
            "or": [
                102
            ],
            "__typename": [
                7
            ]
        },
        "NullableDurationComparator": {
            "eq": [
                104
            ],
            "neq": [
                104
            ],
            "in": [
                104
            ],
            "nin": [
                104
            ],
            "null": [
                12
            ],
            "lt": [
                104
            ],
            "lte": [
                104
            ],
            "gt": [
                104
            ],
            "gte": [
                104
            ],
            "__typename": [
                7
            ]
        },
        "Duration": {},
        "Int": {},
        "PaginationOrderBy": {},
        "DocumentConnection": {
            "edges": [
                108
            ],
            "nodes": [
                109
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "DocumentEdge": {
            "node": [
                109
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Document": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "title": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "creator": [
                6
            ],
            "updatedBy": [
                6
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "issue": [
                16
            ],
            "release": [
                265
            ],
            "cycle": [
                21
            ],
            "slugId": [
                7
            ],
            "lastAppliedTemplate": [
                116
            ],
            "hiddenAt": [
                5
            ],
            "trashed": [
                12
            ],
            "sortOrder": [
                9
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "content": [
                7
            ],
            "contentState": [
                7
            ],
            "documentContentId": [
                7
            ],
            "url": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Project": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "updateReminderFrequencyInWeeks": [
                9
            ],
            "updateReminderFrequency": [
                9
            ],
            "frequencyResolution": [
                111
            ],
            "updateRemindersDay": [
                112
            ],
            "updateRemindersHour": [
                9
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "slugId": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "status": [
                113
            ],
            "creator": [
                6
            ],
            "lead": [
                6
            ],
            "facets": [
                10
            ],
            "projectUpdateRemindersPausedUntilAt": [
                5
            ],
            "startDate": [
                17
            ],
            "startDateResolution": [
                115
            ],
            "targetDate": [
                17
            ],
            "targetDateResolution": [
                115
            ],
            "startedAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "canceledAt": [
                5
            ],
            "autoArchivedAt": [
                5
            ],
            "trashed": [
                12
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "convertedFromIssue": [
                16
            ],
            "lastAppliedTemplate": [
                116
            ],
            "priority": [
                105
            ],
            "lastUpdate": [
                118
            ],
            "health": [
                119
            ],
            "healthUpdatedAt": [
                5
            ],
            "issueCountHistory": [
                9
            ],
            "completedIssueCountHistory": [
                9
            ],
            "scopeHistory": [
                9
            ],
            "completedScopeHistory": [
                9
            ],
            "inProgressScopeHistory": [
                9
            ],
            "progressHistory": [
                18
            ],
            "currentProgress": [
                18
            ],
            "slackNewIssue": [
                12
            ],
            "slackIssueComments": [
                12
            ],
            "slackIssueStatuses": [
                12
            ],
            "labelIds": [
                7
            ],
            "favorite": [
                210
            ],
            "url": [
                7
            ],
            "initiatives": [
                161,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "initiativeToProjects": [
                273,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "teams": [
                276,
                {
                    "filter": [
                        51
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "members": [
                278,
                {
                    "filter": [
                        49
                    ],
                    "includeDisabled": [
                        12
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectUpdates": [
                280,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectMilestones": [
                282,
                {
                    "filter": [
                        69
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "externalLinks": [
                151,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "attachments": [
                284,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "history": [
                286,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "labels": [
                254,
                {
                    "filter": [
                        57
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "progress": [
                9
            ],
            "scope": [
                9
            ],
            "integrationsSettings": [
                154
            ],
            "content": [
                7
            ],
            "contentState": [
                7
            ],
            "documentContent": [
                122
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "relations": [
                289,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "inverseRelations": [
                289,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "needs": [
                292,
                {
                    "filter": [
                        83
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "state": [
                7
            ],
            "priorityLabel": [
                7
            ],
            "syncedWith": [
                204
            ],
            "__typename": [
                7
            ]
        },
        "FrequencyResolutionType": {},
        "Day": {},
        "ProjectStatus": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "type": [
                114
            ],
            "indefinite": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusType": {},
        "DateResolutionType": {},
        "Template": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "templateData": [
                117
            ],
            "sortOrder": [
                9
            ],
            "lastAppliedAt": [
                5
            ],
            "organization": [
                8
            ],
            "team": [
                11
            ],
            "creator": [
                6
            ],
            "lastUpdatedBy": [
                6
            ],
            "inheritedFrom": [
                116
            ],
            "hasFormFields": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "JSON": {},
        "ProjectUpdate": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "body": [
                7
            ],
            "editedAt": [
                5
            ],
            "reactionData": [
                18
            ],
            "bodyData": [
                7
            ],
            "slugId": [
                7
            ],
            "project": [
                110
            ],
            "health": [
                119
            ],
            "user": [
                6
            ],
            "infoSnapshot": [
                18
            ],
            "isDiffHidden": [
                12
            ],
            "url": [
                7
            ],
            "isStale": [
                12
            ],
            "diff": [
                18
            ],
            "diffMarkdown": [
                7
            ],
            "reactions": [
                120
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "commentCount": [
                105
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateHealthType": {},
        "Reaction": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "emoji": [
                7
            ],
            "issue": [
                16
            ],
            "comment": [
                121
            ],
            "projectUpdate": [
                118
            ],
            "initiativeUpdate": [
                131
            ],
            "post": [
                176
            ],
            "user": [
                6
            ],
            "externalUser": [
                179
            ],
            "__typename": [
                7
            ]
        },
        "Comment": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "body": [
                7
            ],
            "issue": [
                16
            ],
            "issueId": [
                7
            ],
            "documentContent": [
                122
            ],
            "documentContentId": [
                7
            ],
            "projectUpdate": [
                118
            ],
            "projectUpdateId": [
                7
            ],
            "initiativeUpdate": [
                131
            ],
            "initiativeUpdateId": [
                7
            ],
            "post": [
                176
            ],
            "parent": [
                121
            ],
            "parentId": [
                7
            ],
            "resolvingUser": [
                6
            ],
            "resolvedAt": [
                5
            ],
            "resolvingComment": [
                121
            ],
            "resolvingCommentId": [
                7
            ],
            "user": [
                6
            ],
            "externalUser": [
                179
            ],
            "editedAt": [
                5
            ],
            "bodyData": [
                7
            ],
            "quotedText": [
                7
            ],
            "reactionData": [
                18
            ],
            "threadSummary": [
                18
            ],
            "isArtificialAgentSessionRoot": [
                12
            ],
            "url": [
                7
            ],
            "children": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "agentSession": [
                180
            ],
            "agentSessions": [
                200,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "spawnedAgentSessions": [
                200,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "createdIssues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "botActor": [
                202
            ],
            "onBehalfOf": [
                6
            ],
            "externalThread": [
                203
            ],
            "hideInLinear": [
                12
            ],
            "reactions": [
                120
            ],
            "syncedWith": [
                204
            ],
            "__typename": [
                7
            ]
        },
        "DocumentContent": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "content": [
                7
            ],
            "contentState": [
                7
            ],
            "issue": [
                16
            ],
            "pullRequest": [
                123
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "projectMilestone": [
                172
            ],
            "document": [
                109
            ],
            "aiPromptRules": [
                174
            ],
            "welcomeMessage": [
                175
            ],
            "restoredAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "PullRequest": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "slugId": [
                7
            ],
            "title": [
                7
            ],
            "number": [
                9
            ],
            "sourceBranch": [
                7
            ],
            "targetBranch": [
                7
            ],
            "url": [
                7
            ],
            "status": [
                124
            ],
            "mergeSettings": [
                125
            ],
            "mergeCommit": [
                127
            ],
            "checks": [
                128
            ],
            "commits": [
                127
            ],
            "creator": [
                6
            ],
            "__typename": [
                7
            ]
        },
        "PullRequestStatus": {},
        "PullRequestMergeSettings": {
            "isMergeQueueEnabled": [
                12
            ],
            "squashMergeAllowed": [
                12
            ],
            "autoMergeAllowed": [
                12
            ],
            "rebaseMergeAllowed": [
                12
            ],
            "mergeCommitAllowed": [
                12
            ],
            "deleteBranchOnMerge": [
                12
            ],
            "mergeQueueMergeMethod": [
                126
            ],
            "__typename": [
                7
            ]
        },
        "PullRequestMergeMethod": {},
        "PullRequestCommit": {
            "sha": [
                7
            ],
            "message": [
                7
            ],
            "committedAt": [
                7
            ],
            "additions": [
                9
            ],
            "deletions": [
                9
            ],
            "changedFiles": [
                9
            ],
            "authorUserIds": [
                7
            ],
            "authorExternalUserIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "PullRequestCheck": {
            "name": [
                7
            ],
            "workflowName": [
                7
            ],
            "status": [
                7
            ],
            "url": [
                7
            ],
            "isRequired": [
                12
            ],
            "startedAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "Initiative": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "updateReminderFrequencyInWeeks": [
                9
            ],
            "updateReminderFrequency": [
                9
            ],
            "frequencyResolution": [
                111
            ],
            "updateRemindersDay": [
                112
            ],
            "updateRemindersHour": [
                9
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "organization": [
                8
            ],
            "creator": [
                6
            ],
            "owner": [
                6
            ],
            "slugId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "color": [
                7
            ],
            "icon": [
                7
            ],
            "trashed": [
                12
            ],
            "facets": [
                10
            ],
            "targetDate": [
                17
            ],
            "targetDateResolution": [
                115
            ],
            "status": [
                130
            ],
            "lastUpdate": [
                131
            ],
            "health": [
                132
            ],
            "healthUpdatedAt": [
                5
            ],
            "startedAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "url": [
                7
            ],
            "projects": [
                136,
                {
                    "includeSubInitiatives": [
                        12
                    ],
                    "filter": [
                        73
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        138,
                        "[ProjectSortInput!]"
                    ]
                }
            ],
            "links": [
                151,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "integrationsSettings": [
                154
            ],
            "history": [
                156,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "initiativeUpdates": [
                159,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "subInitiatives": [
                161,
                {
                    "filter": [
                        67
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        163,
                        "[InitiativeSortInput!]"
                    ]
                }
            ],
            "parentInitiative": [
                129
            ],
            "parentInitiatives": [
                161,
                {
                    "filter": [
                        67
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        163,
                        "[InitiativeSortInput!]"
                    ]
                }
            ],
            "content": [
                7
            ],
            "documentContent": [
                122
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeStatus": {},
        "InitiativeUpdate": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "body": [
                7
            ],
            "editedAt": [
                5
            ],
            "reactionData": [
                18
            ],
            "bodyData": [
                7
            ],
            "slugId": [
                7
            ],
            "initiative": [
                129
            ],
            "user": [
                6
            ],
            "health": [
                132
            ],
            "infoSnapshot": [
                18
            ],
            "isDiffHidden": [
                12
            ],
            "url": [
                7
            ],
            "isStale": [
                12
            ],
            "diff": [
                18
            ],
            "diffMarkdown": [
                7
            ],
            "reactions": [
                120
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "commentCount": [
                105
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateHealthType": {},
        "CommentConnection": {
            "edges": [
                134
            ],
            "nodes": [
                121
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "CommentEdge": {
            "node": [
                121
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "PageInfo": {
            "hasPreviousPage": [
                12
            ],
            "hasNextPage": [
                12
            ],
            "startCursor": [
                7
            ],
            "endCursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectConnection": {
            "edges": [
                137
            ],
            "nodes": [
                110
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectEdge": {
            "node": [
                110
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectSortInput": {
            "name": [
                139
            ],
            "status": [
                142
            ],
            "priority": [
                143
            ],
            "manual": [
                144
            ],
            "targetDate": [
                145
            ],
            "startDate": [
                146
            ],
            "createdAt": [
                147
            ],
            "updatedAt": [
                148
            ],
            "health": [
                149
            ],
            "lead": [
                150
            ],
            "__typename": [
                7
            ]
        },
        "ProjectNameSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "PaginationNulls": {},
        "PaginationSortOrder": {},
        "ProjectStatusSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ProjectPrioritySort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "noPriorityFirst": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectManualSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "TargetDateSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "StartDateSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ProjectCreatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ProjectHealthSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLeadSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "EntityExternalLinkConnection": {
            "edges": [
                152
            ],
            "nodes": [
                153
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "EntityExternalLinkEdge": {
            "node": [
                153
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EntityExternalLink": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "url": [
                7
            ],
            "label": [
                7
            ],
            "sortOrder": [
                9
            ],
            "creator": [
                6
            ],
            "initiative": [
                129
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationsSettings": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "contextViewType": [
                155
            ],
            "slackIssueCreated": [
                12
            ],
            "slackIssueNewComment": [
                12
            ],
            "slackIssueStatusChangedDone": [
                12
            ],
            "slackIssueAddedToView": [
                12
            ],
            "slackIssueStatusChangedAll": [
                12
            ],
            "slackProjectUpdateCreated": [
                12
            ],
            "slackProjectUpdateCreatedToTeam": [
                12
            ],
            "slackProjectUpdateCreatedToWorkspace": [
                12
            ],
            "slackInitiativeUpdateCreated": [
                12
            ],
            "slackIssueAddedToTriage": [
                12
            ],
            "slackIssueSlaHighRisk": [
                12
            ],
            "slackIssueSlaBreached": [
                12
            ],
            "team": [
                11
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "__typename": [
                7
            ]
        },
        "ContextViewType": {},
        "InitiativeHistoryConnection": {
            "edges": [
                157
            ],
            "nodes": [
                158
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeHistoryEdge": {
            "node": [
                158
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeHistory": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "entries": [
                18
            ],
            "initiative": [
                129
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateConnection": {
            "edges": [
                160
            ],
            "nodes": [
                131
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateEdge": {
            "node": [
                131
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeConnection": {
            "edges": [
                162
            ],
            "nodes": [
                129
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeEdge": {
            "node": [
                129
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeSortInput": {
            "name": [
                164
            ],
            "manual": [
                165
            ],
            "updatedAt": [
                166
            ],
            "createdAt": [
                167
            ],
            "targetDate": [
                168
            ],
            "health": [
                169
            ],
            "healthUpdatedAt": [
                170
            ],
            "owner": [
                171
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeNameSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeManualSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeCreatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeTargetDateSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeHealthSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeHealthUpdatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeOwnerSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestone": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "documentContent": [
                122
            ],
            "targetDate": [
                17
            ],
            "project": [
                110
            ],
            "progressHistory": [
                18
            ],
            "currentProgress": [
                18
            ],
            "sortOrder": [
                9
            ],
            "description": [
                7
            ],
            "status": [
                173
            ],
            "progress": [
                9
            ],
            "descriptionState": [
                7
            ],
            "issues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneStatus": {},
        "AiPromptRules": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "updatedBy": [
                6
            ],
            "__typename": [
                7
            ]
        },
        "WelcomeMessage": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "title": [
                7
            ],
            "enabled": [
                12
            ],
            "updatedBy": [
                6
            ],
            "__typename": [
                7
            ]
        },
        "Post": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "body": [
                7
            ],
            "bodyData": [
                7
            ],
            "writtenSummaryData": [
                18
            ],
            "audioSummary": [
                7
            ],
            "title": [
                7
            ],
            "slugId": [
                7
            ],
            "creator": [
                6
            ],
            "editedAt": [
                5
            ],
            "reactionData": [
                18
            ],
            "ttlUrl": [
                7
            ],
            "user": [
                6
            ],
            "team": [
                11
            ],
            "type": [
                177
            ],
            "evalLogId": [
                7
            ],
            "feedSummaryScheduleAtCreate": [
                178
            ],
            "__typename": [
                7
            ]
        },
        "PostType": {},
        "FeedSummarySchedule": {},
        "ExternalUser": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "displayName": [
                7
            ],
            "email": [
                7
            ],
            "avatarUrl": [
                7
            ],
            "organization": [
                8
            ],
            "lastSeen": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "AgentSession": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "creator": [
                6
            ],
            "appUser": [
                6
            ],
            "comment": [
                121
            ],
            "sourceComment": [
                121
            ],
            "issue": [
                16
            ],
            "status": [
                181
            ],
            "startedAt": [
                5
            ],
            "endedAt": [
                5
            ],
            "dismissedAt": [
                5
            ],
            "dismissedBy": [
                6
            ],
            "activities": [
                182,
                {
                    "filter": [
                        194
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "externalLink": [
                7
            ],
            "summary": [
                7
            ],
            "sourceMetadata": [
                117
            ],
            "plan": [
                117
            ],
            "context": [
                117
            ],
            "type": [
                195
            ],
            "url": [
                7
            ],
            "pullRequests": [
                196,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "externalLinks": [
                199
            ],
            "externalUrls": [
                117
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionStatus": {},
        "AgentActivityConnection": {
            "edges": [
                183
            ],
            "nodes": [
                184
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityEdge": {
            "node": [
                184
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivity": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "agentSession": [
                180
            ],
            "content": [
                185
            ],
            "sourceComment": [
                121
            ],
            "user": [
                6
            ],
            "sourceMetadata": [
                117
            ],
            "signal": [
                193
            ],
            "ephemeral": [
                12
            ],
            "contextualMetadata": [
                117
            ],
            "signalMetadata": [
                117
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityContent": {
            "on_AgentActivityThoughtContent": [
                186
            ],
            "on_AgentActivityActionContent": [
                188
            ],
            "on_AgentActivityResponseContent": [
                189
            ],
            "on_AgentActivityPromptContent": [
                190
            ],
            "on_AgentActivityErrorContent": [
                191
            ],
            "on_AgentActivityElicitationContent": [
                192
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityThoughtContent": {
            "type": [
                187
            ],
            "body": [
                7
            ],
            "bodyData": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityType": {},
        "AgentActivityActionContent": {
            "type": [
                187
            ],
            "action": [
                7
            ],
            "parameter": [
                7
            ],
            "result": [
                7
            ],
            "resultData": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityResponseContent": {
            "type": [
                187
            ],
            "body": [
                7
            ],
            "bodyData": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityPromptContent": {
            "type": [
                187
            ],
            "body": [
                7
            ],
            "bodyData": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityErrorContent": {
            "type": [
                187
            ],
            "body": [
                7
            ],
            "bodyData": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityElicitationContent": {
            "type": [
                187
            ],
            "body": [
                7
            ],
            "bodyData": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivitySignal": {},
        "AgentActivityFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "agentSessionId": [
                27
            ],
            "type": [
                27
            ],
            "sourceComment": [
                71
            ],
            "and": [
                194
            ],
            "or": [
                194
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionType": {},
        "AgentSessionToPullRequestConnection": {
            "edges": [
                197
            ],
            "nodes": [
                198
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionToPullRequestEdge": {
            "node": [
                198
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionToPullRequest": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "pullRequest": [
                123
            ],
            "agentSession": [
                180
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionExternalLink": {
            "url": [
                7
            ],
            "label": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionConnection": {
            "edges": [
                201
            ],
            "nodes": [
                180
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionEdge": {
            "node": [
                180
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ActorBot": {
            "id": [
                4
            ],
            "type": [
                7
            ],
            "subType": [
                7
            ],
            "name": [
                7
            ],
            "userDisplayName": [
                7
            ],
            "avatarUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "SyncedExternalThread": {
            "id": [
                4
            ],
            "type": [
                7
            ],
            "subType": [
                7
            ],
            "name": [
                7
            ],
            "displayName": [
                7
            ],
            "url": [
                7
            ],
            "isConnected": [
                12
            ],
            "isPersonalIntegrationConnected": [
                12
            ],
            "isPersonalIntegrationRequired": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ExternalEntityInfo": {
            "id": [
                7
            ],
            "service": [
                205
            ],
            "metadata": [
                206
            ],
            "__typename": [
                7
            ]
        },
        "ExternalSyncService": {},
        "ExternalEntityInfoMetadata": {
            "on_ExternalEntityInfoGithubMetadata": [
                207
            ],
            "on_ExternalEntityInfoJiraMetadata": [
                208
            ],
            "on_ExternalEntitySlackMetadata": [
                209
            ],
            "__typename": [
                7
            ]
        },
        "ExternalEntityInfoGithubMetadata": {
            "repo": [
                7
            ],
            "owner": [
                7
            ],
            "number": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "ExternalEntityInfoJiraMetadata": {
            "issueKey": [
                7
            ],
            "projectId": [
                7
            ],
            "issueTypeId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ExternalEntitySlackMetadata": {
            "isFromSlack": [
                12
            ],
            "channelId": [
                7
            ],
            "channelName": [
                7
            ],
            "messageUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Favorite": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "parent": [
                210
            ],
            "folderName": [
                7
            ],
            "projectTab": [
                211
            ],
            "predefinedViewType": [
                7
            ],
            "initiativeTab": [
                212
            ],
            "owner": [
                6
            ],
            "sortOrder": [
                9
            ],
            "children": [
                213,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issue": [
                16
            ],
            "project": [
                110
            ],
            "facet": [
                10
            ],
            "projectTeam": [
                11
            ],
            "cycle": [
                21
            ],
            "customView": [
                215
            ],
            "predefinedViewTeam": [
                11
            ],
            "document": [
                109
            ],
            "initiative": [
                129
            ],
            "label": [
                250
            ],
            "projectLabel": [
                253
            ],
            "user": [
                6
            ],
            "customer": [
                256
            ],
            "dashboard": [
                264
            ],
            "pullRequest": [
                123
            ],
            "release": [
                265
            ],
            "releasePipeline": [
                266
            ],
            "url": [
                7
            ],
            "title": [
                7
            ],
            "detail": [
                7
            ],
            "color": [
                7
            ],
            "icon": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectTab": {},
        "InitiativeTab": {},
        "FavoriteConnection": {
            "edges": [
                214
            ],
            "nodes": [
                210
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "FavoriteEdge": {
            "node": [
                210
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomView": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "organization": [
                8
            ],
            "creator": [
                6
            ],
            "owner": [
                6
            ],
            "updatedBy": [
                6
            ],
            "filters": [
                18
            ],
            "filterData": [
                18
            ],
            "projectFilterData": [
                18
            ],
            "initiativeFilterData": [
                18
            ],
            "feedItemFilterData": [
                18
            ],
            "shared": [
                12
            ],
            "slugId": [
                7
            ],
            "modelName": [
                7
            ],
            "facet": [
                10
            ],
            "team": [
                11
            ],
            "projects": [
                136,
                {
                    "includeSubTeams": [
                        12
                    ],
                    "filter": [
                        73
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        138,
                        "[ProjectSortInput!]"
                    ]
                }
            ],
            "issues": [
                14,
                {
                    "includeSubTeams": [
                        12
                    ],
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        216,
                        "[IssueSortInput!]"
                    ]
                }
            ],
            "updates": [
                242,
                {
                    "includeSubTeams": [
                        12
                    ],
                    "filter": [
                        245
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "userViewPreferences": [
                247
            ],
            "organizationViewPreferences": [
                247
            ],
            "viewPreferencesValues": [
                248
            ],
            "initiatives": [
                161,
                {
                    "filter": [
                        67
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "IssueSortInput": {
            "priority": [
                217
            ],
            "estimate": [
                218
            ],
            "title": [
                219
            ],
            "label": [
                220
            ],
            "labelGroup": [
                221
            ],
            "slaStatus": [
                222
            ],
            "createdAt": [
                223
            ],
            "updatedAt": [
                224
            ],
            "completedAt": [
                225
            ],
            "dueDate": [
                226
            ],
            "accumulatedStateUpdatedAt": [
                227
            ],
            "cycle": [
                228
            ],
            "milestone": [
                229
            ],
            "assignee": [
                230
            ],
            "delegate": [
                231
            ],
            "project": [
                232
            ],
            "team": [
                233
            ],
            "manual": [
                234
            ],
            "workflowState": [
                235
            ],
            "customer": [
                236
            ],
            "customerRevenue": [
                237
            ],
            "customerCount": [
                238
            ],
            "customerImportantCount": [
                239
            ],
            "rootIssue": [
                240
            ],
            "linkCount": [
                241
            ],
            "__typename": [
                7
            ]
        },
        "PrioritySort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "noPriorityFirst": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EstimateSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "TitleSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "LabelSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "LabelGroupSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "labelGroupId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "SlaStatusSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CreatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "UpdatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CompletedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "DueDateSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "TimeInStatusSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CycleSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "currentCycleFirst": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "MilestoneSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "AssigneeSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "DelegateSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ProjectSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "TeamSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ManualSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStateSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "closedIssuesOrderedByRecency": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomerSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomerRevenueSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomerCountSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomerImportantCountSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "RootIssueSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "sort": [
                216
            ],
            "__typename": [
                7
            ]
        },
        "LinkCountSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "FeedItemConnection": {
            "edges": [
                243
            ],
            "nodes": [
                244
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "FeedItemEdge": {
            "node": [
                244
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "FeedItem": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "organization": [
                8
            ],
            "user": [
                6
            ],
            "team": [
                11
            ],
            "projectUpdate": [
                118
            ],
            "initiativeUpdate": [
                131
            ],
            "post": [
                176
            ],
            "__typename": [
                7
            ]
        },
        "FeedItemFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "author": [
                49
            ],
            "updateType": [
                27
            ],
            "updateHealth": [
                27
            ],
            "projectUpdate": [
                246
            ],
            "relatedInitiatives": [
                63
            ],
            "relatedTeams": [
                64
            ],
            "and": [
                245
            ],
            "or": [
                245
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "user": [
                49
            ],
            "project": [
                73
            ],
            "reactions": [
                74
            ],
            "and": [
                246
            ],
            "or": [
                246
            ],
            "__typename": [
                7
            ]
        },
        "ViewPreferences": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "viewType": [
                7
            ],
            "preferences": [
                248
            ],
            "__typename": [
                7
            ]
        },
        "ViewPreferencesValues": {
            "layout": [
                7
            ],
            "viewOrdering": [
                7
            ],
            "viewOrderingDirection": [
                7
            ],
            "issueGrouping": [
                7
            ],
            "issueSubGrouping": [
                7
            ],
            "issueNesting": [
                7
            ],
            "showCompletedIssues": [
                7
            ],
            "showParents": [
                12
            ],
            "showSubIssues": [
                12
            ],
            "showSubTeamIssues": [
                12
            ],
            "showSupervisedIssues": [
                12
            ],
            "showTriageIssues": [
                12
            ],
            "showSnoozedItems": [
                12
            ],
            "showOnlySnoozedItems": [
                12
            ],
            "showArchivedItems": [
                12
            ],
            "showReadItems": [
                12
            ],
            "showUnreadItemsFirst": [
                12
            ],
            "closedIssuesOrderedByRecency": [
                12
            ],
            "showEmptyGroups": [
                12
            ],
            "showEmptyGroupsBoard": [
                12
            ],
            "showEmptyGroupsList": [
                12
            ],
            "showEmptySubGroups": [
                12
            ],
            "showEmptySubGroupsBoard": [
                12
            ],
            "showEmptySubGroupsList": [
                12
            ],
            "issueGroupingLabelGroupId": [
                7
            ],
            "issueSubGroupingLabelGroupId": [
                7
            ],
            "fieldId": [
                12
            ],
            "fieldStatus": [
                12
            ],
            "fieldPriority": [
                12
            ],
            "fieldDateCreated": [
                12
            ],
            "fieldDateUpdated": [
                12
            ],
            "fieldDateArchived": [
                12
            ],
            "fieldDateMyActivity": [
                12
            ],
            "fieldAssignee": [
                12
            ],
            "fieldEstimate": [
                12
            ],
            "fieldPullRequests": [
                12
            ],
            "fieldPreviewLinks": [
                12
            ],
            "fieldSentryIssues": [
                12
            ],
            "fieldDueDate": [
                12
            ],
            "fieldLinkCount": [
                12
            ],
            "fieldCustomerCount": [
                12
            ],
            "fieldCustomerRevenue": [
                12
            ],
            "fieldSla": [
                12
            ],
            "fieldLabels": [
                12
            ],
            "fieldProject": [
                12
            ],
            "fieldCycle": [
                12
            ],
            "fieldMilestone": [
                12
            ],
            "fieldRelease": [
                12
            ],
            "fieldTimeInCurrentStatus": [
                12
            ],
            "hiddenColumns": [
                7
            ],
            "hiddenRows": [
                7
            ],
            "projectLayout": [
                7
            ],
            "projectViewOrdering": [
                7
            ],
            "projectGrouping": [
                7
            ],
            "projectSubGrouping": [
                7
            ],
            "projectGroupOrdering": [
                7
            ],
            "projectGroupingDateResolution": [
                7
            ],
            "showCompletedProjects": [
                7
            ],
            "projectGroupingLabelGroupId": [
                7
            ],
            "projectSubGroupingLabelGroupId": [
                7
            ],
            "projectLabelGroupColumns": [
                249
            ],
            "showSubTeamProjects": [
                12
            ],
            "showSubInitiativeProjects": [
                12
            ],
            "projectShowEmptyGroups": [
                7
            ],
            "projectShowEmptyGroupsList": [
                7
            ],
            "projectShowEmptyGroupsTimeline": [
                7
            ],
            "projectShowEmptyGroupsBoard": [
                7
            ],
            "projectShowEmptySubGroups": [
                7
            ],
            "projectShowEmptySubGroupsList": [
                7
            ],
            "projectShowEmptySubGroupsTimeline": [
                7
            ],
            "projectShowEmptySubGroupsBoard": [
                7
            ],
            "projectFieldStatus": [
                12
            ],
            "projectFieldPriority": [
                12
            ],
            "projectFieldLead": [
                12
            ],
            "projectFieldHealth": [
                12
            ],
            "projectFieldMembers": [
                12
            ],
            "projectFieldStartDate": [
                12
            ],
            "projectFieldTargetDate": [
                12
            ],
            "projectFieldTeams": [
                12
            ],
            "projectFieldRoadmaps": [
                12
            ],
            "projectFieldInitiatives": [
                12
            ],
            "projectFieldMilestone": [
                12
            ],
            "projectFieldDescription": [
                12
            ],
            "projectFieldPredictions": [
                12
            ],
            "projectFieldRelations": [
                12
            ],
            "projectFieldRolloutStage": [
                12
            ],
            "projectFieldActivity": [
                12
            ],
            "projectFieldCustomerCount": [
                12
            ],
            "projectFieldCustomerRevenue": [
                12
            ],
            "projectFieldLabels": [
                12
            ],
            "projectFieldDateCreated": [
                12
            ],
            "projectFieldDateUpdated": [
                12
            ],
            "projectFieldDateCompleted": [
                12
            ],
            "projectFieldStatusTimeline": [
                12
            ],
            "projectFieldLeadTimeline": [
                12
            ],
            "projectFieldHealthTimeline": [
                12
            ],
            "projectFieldMilestoneTimeline": [
                12
            ],
            "projectFieldPredictionsTimeline": [
                12
            ],
            "projectFieldRelationsTimeline": [
                12
            ],
            "projectFieldDescriptionBoard": [
                12
            ],
            "projectFieldMembersBoard": [
                12
            ],
            "projectFieldMembersList": [
                12
            ],
            "projectFieldMembersTimeline": [
                12
            ],
            "projectFieldRoadmapsBoard": [
                12
            ],
            "projectFieldRoadmapsList": [
                12
            ],
            "projectFieldRoadmapsTimeline": [
                12
            ],
            "projectFieldTeamsBoard": [
                12
            ],
            "projectFieldTeamsList": [
                12
            ],
            "projectFieldTeamsTimeline": [
                12
            ],
            "projectZoomLevel": [
                7
            ],
            "timelineZoomScale": [
                9
            ],
            "timelineChronologyShowCycleTeamIds": [
                7
            ],
            "timelineChronologyShowWeekNumbers": [
                12
            ],
            "initiativeGrouping": [
                7
            ],
            "initiativesViewOrdering": [
                7
            ],
            "initiativeFieldProjects": [
                12
            ],
            "initiativeFieldTeams": [
                12
            ],
            "initiativeFieldDescription": [
                12
            ],
            "initiativeFieldOwner": [
                12
            ],
            "initiativeFieldStartDate": [
                12
            ],
            "initiativeFieldTargetDate": [
                12
            ],
            "initiativeFieldDateCompleted": [
                12
            ],
            "initiativeFieldDateUpdated": [
                12
            ],
            "initiativeFieldDateCreated": [
                12
            ],
            "initiativeFieldActivity": [
                12
            ],
            "initiativeFieldInitiativeHealth": [
                12
            ],
            "initiativeFieldHealth": [
                12
            ],
            "showNestedInitiatives": [
                12
            ],
            "customersViewOrdering": [
                7
            ],
            "customerFieldRequestCount": [
                12
            ],
            "customerFieldDomains": [
                12
            ],
            "customerFieldOwner": [
                12
            ],
            "customerFieldRevenue": [
                12
            ],
            "customerFieldSize": [
                12
            ],
            "customerFieldSource": [
                12
            ],
            "customerFieldStatus": [
                12
            ],
            "customerFieldTier": [
                12
            ],
            "customerPageNeedsViewGrouping": [
                7
            ],
            "customerPageNeedsViewOrdering": [
                7
            ],
            "customerPageNeedsShowImportantFirst": [
                12
            ],
            "customerPageNeedsShowCompletedIssuesAndProjects": [
                7
            ],
            "customerPageNeedsFieldIssueIdentifier": [
                12
            ],
            "customerPageNeedsFieldIssuePriority": [
                12
            ],
            "customerPageNeedsFieldIssueStatus": [
                12
            ],
            "customerPageNeedsFieldIssueTargetDueDate": [
                12
            ],
            "embeddedCustomerNeedsViewOrdering": [
                7
            ],
            "embeddedCustomerNeedsShowImportantFirst": [
                12
            ],
            "projectCustomerNeedsViewGrouping": [
                7
            ],
            "projectCustomerNeedsViewOrdering": [
                7
            ],
            "projectCustomerNeedsShowImportantFirst": [
                12
            ],
            "projectCustomerNeedsShowCompletedIssuesLast": [
                12
            ],
            "teamViewOrdering": [
                7
            ],
            "teamFieldIdentifier": [
                12
            ],
            "teamFieldMembership": [
                12
            ],
            "teamFieldOwner": [
                12
            ],
            "teamFieldMembers": [
                12
            ],
            "teamFieldProjects": [
                12
            ],
            "teamFieldCycle": [
                12
            ],
            "teamFieldDateCreated": [
                12
            ],
            "teamFieldDateUpdated": [
                12
            ],
            "customViewsOrdering": [
                7
            ],
            "customViewFieldOwner": [
                12
            ],
            "customViewFieldVisibility": [
                12
            ],
            "customViewFieldDateCreated": [
                12
            ],
            "customViewFieldDateUpdated": [
                12
            ],
            "dashboardsOrdering": [
                7
            ],
            "dashboardFieldOwner": [
                12
            ],
            "dashboardFieldDateCreated": [
                12
            ],
            "dashboardFieldDateUpdated": [
                12
            ],
            "workspaceMembersViewOrdering": [
                7
            ],
            "memberFieldStatus": [
                12
            ],
            "memberFieldJoined": [
                12
            ],
            "memberFieldTeams": [
                12
            ],
            "releasePipelinesViewOrdering": [
                7
            ],
            "releasePipelineFieldType": [
                12
            ],
            "releasePipelineFieldReleases": [
                12
            ],
            "releasePipelineFieldLatestRelease": [
                12
            ],
            "searchViewOrdering": [
                7
            ],
            "searchResultType": [
                7
            ],
            "inboxViewOrdering": [
                7
            ],
            "triageViewOrdering": [
                7
            ],
            "reviewGrouping": [
                7
            ],
            "reviewViewOrdering": [
                7
            ],
            "showCompletedReviews": [
                7
            ],
            "showDraftReviews": [
                12
            ],
            "reviewFieldAvatar": [
                12
            ],
            "reviewFieldPreviewLinks": [
                12
            ],
            "reviewFieldRepository": [
                12
            ],
            "reviewFieldIdentifier": [
                12
            ],
            "reviewFieldChecks": [
                12
            ],
            "showCompletedAgentSessions": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ViewPreferencesProjectLabelGroupColumn": {
            "id": [
                7
            ],
            "active": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabel": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "color": [
                7
            ],
            "isGroup": [
                12
            ],
            "lastAppliedAt": [
                5
            ],
            "retiredAt": [
                5
            ],
            "organization": [
                8
            ],
            "team": [
                11
            ],
            "creator": [
                6
            ],
            "retiredBy": [
                6
            ],
            "parent": [
                250
            ],
            "inheritedFrom": [
                250
            ],
            "issues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "children": [
                251,
                {
                    "filter": [
                        47
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabelConnection": {
            "edges": [
                252
            ],
            "nodes": [
                250
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabelEdge": {
            "node": [
                250
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabel": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "color": [
                7
            ],
            "isGroup": [
                12
            ],
            "lastAppliedAt": [
                5
            ],
            "retiredAt": [
                5
            ],
            "organization": [
                8
            ],
            "creator": [
                6
            ],
            "retiredBy": [
                6
            ],
            "parent": [
                253
            ],
            "projects": [
                136,
                {
                    "filter": [
                        73
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        138,
                        "[ProjectSortInput!]"
                    ]
                }
            ],
            "children": [
                254,
                {
                    "filter": [
                        57
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabelConnection": {
            "edges": [
                255
            ],
            "nodes": [
                253
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabelEdge": {
            "node": [
                253
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Customer": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "logoUrl": [
                7
            ],
            "domains": [
                7
            ],
            "externalIds": [
                7
            ],
            "slackChannelId": [
                7
            ],
            "owner": [
                6
            ],
            "status": [
                257
            ],
            "revenue": [
                105
            ],
            "size": [
                9
            ],
            "tier": [
                259
            ],
            "approximateNeedCount": [
                9
            ],
            "slugId": [
                7
            ],
            "mainSourceId": [
                7
            ],
            "needs": [
                260
            ],
            "integration": [
                263
            ],
            "url": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatus": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "displayName": [
                7
            ],
            "type": [
                258
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusType": {},
        "CustomerTier": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "displayName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeed": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "customer": [
                256
            ],
            "issue": [
                16
            ],
            "project": [
                110
            ],
            "comment": [
                121
            ],
            "attachment": [
                261
            ],
            "projectAttachment": [
                262
            ],
            "priority": [
                9
            ],
            "body": [
                7
            ],
            "bodyData": [
                7
            ],
            "creator": [
                6
            ],
            "originalIssue": [
                16
            ],
            "url": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Attachment": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "url": [
                7
            ],
            "creator": [
                6
            ],
            "externalUserCreator": [
                179
            ],
            "metadata": [
                18
            ],
            "source": [
                18
            ],
            "sourceType": [
                7
            ],
            "groupBySource": [
                12
            ],
            "originalIssue": [
                16
            ],
            "issue": [
                16
            ],
            "bodyData": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectAttachment": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "url": [
                7
            ],
            "creator": [
                6
            ],
            "metadata": [
                18
            ],
            "source": [
                18
            ],
            "sourceType": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Integration": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "service": [
                7
            ],
            "organization": [
                8
            ],
            "team": [
                11
            ],
            "creator": [
                6
            ],
            "__typename": [
                7
            ]
        },
        "Dashboard": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "slugId": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "sortOrder": [
                9
            ],
            "shared": [
                12
            ],
            "organization": [
                8
            ],
            "creator": [
                6
            ],
            "updatedBy": [
                6
            ],
            "owner": [
                6
            ],
            "issueFilter": [
                18
            ],
            "projectFilter": [
                18
            ],
            "widgets": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "Release": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "version": [
                7
            ],
            "commitSha": [
                7
            ],
            "pipeline": [
                266
            ],
            "stage": [
                270
            ],
            "slugId": [
                7
            ],
            "startDate": [
                17
            ],
            "targetDate": [
                17
            ],
            "startedAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "canceledAt": [
                5
            ],
            "progressHistory": [
                18
            ],
            "currentProgress": [
                18
            ],
            "url": [
                7
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "links": [
                151,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipeline": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "slugId": [
                7
            ],
            "type": [
                267
            ],
            "includePathPatterns": [
                7
            ],
            "approximateReleaseCount": [
                105
            ],
            "stages": [
                268,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "releases": [
                271,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelineType": {},
        "ReleaseStageConnection": {
            "edges": [
                269
            ],
            "nodes": [
                270
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStageEdge": {
            "node": [
                270
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStage": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "type": [
                101
            ],
            "position": [
                9
            ],
            "frozen": [
                12
            ],
            "pipeline": [
                266
            ],
            "releases": [
                271,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseConnection": {
            "edges": [
                272
            ],
            "nodes": [
                265
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseEdge": {
            "node": [
                265
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeToProjectConnection": {
            "edges": [
                274
            ],
            "nodes": [
                275
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeToProjectEdge": {
            "node": [
                275
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeToProject": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "sortOrder": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TeamConnection": {
            "edges": [
                277
            ],
            "nodes": [
                11
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "TeamEdge": {
            "node": [
                11
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "UserConnection": {
            "edges": [
                279
            ],
            "nodes": [
                6
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "UserEdge": {
            "node": [
                6
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateConnection": {
            "edges": [
                281
            ],
            "nodes": [
                118
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateEdge": {
            "node": [
                118
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneConnection": {
            "edges": [
                283
            ],
            "nodes": [
                172
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneEdge": {
            "node": [
                172
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectAttachmentConnection": {
            "edges": [
                285
            ],
            "nodes": [
                262
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectAttachmentEdge": {
            "node": [
                262
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectHistoryConnection": {
            "edges": [
                287
            ],
            "nodes": [
                288
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectHistoryEdge": {
            "node": [
                288
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectHistory": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "entries": [
                18
            ],
            "project": [
                110
            ],
            "__typename": [
                7
            ]
        },
        "ProjectRelationConnection": {
            "edges": [
                290
            ],
            "nodes": [
                291
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectRelationEdge": {
            "node": [
                291
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectRelation": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "project": [
                110
            ],
            "projectMilestone": [
                172
            ],
            "anchorType": [
                7
            ],
            "relatedProject": [
                110
            ],
            "relatedProjectMilestone": [
                172
            ],
            "relatedAnchorType": [
                7
            ],
            "user": [
                6
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedConnection": {
            "edges": [
                293
            ],
            "nodes": [
                260
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedEdge": {
            "node": [
                260
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationService": {},
        "IssueSharedAccess": {
            "isShared": [
                12
            ],
            "viewerHasOnlySharedAccess": [
                12
            ],
            "sharedWithCount": [
                105
            ],
            "sharedWithUsers": [
                6
            ],
            "disallowedIssueFields": [
                296
            ],
            "__typename": [
                7
            ]
        },
        "IssueSharedAccessDisallowedField": {},
        "IssueHistoryConnection": {
            "edges": [
                298
            ],
            "nodes": [
                299
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueHistoryEdge": {
            "node": [
                299
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueHistory": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "issue": [
                16
            ],
            "actorId": [
                7
            ],
            "updatedDescription": [
                12
            ],
            "fromTitle": [
                7
            ],
            "toTitle": [
                7
            ],
            "fromAssigneeId": [
                7
            ],
            "toAssigneeId": [
                7
            ],
            "fromPriority": [
                9
            ],
            "toPriority": [
                9
            ],
            "fromTeamId": [
                7
            ],
            "toTeamId": [
                7
            ],
            "fromParentId": [
                7
            ],
            "toParentId": [
                7
            ],
            "fromStateId": [
                7
            ],
            "toStateId": [
                7
            ],
            "fromCycleId": [
                7
            ],
            "toCycleId": [
                7
            ],
            "toConvertedProjectId": [
                7
            ],
            "fromProjectId": [
                7
            ],
            "toProjectId": [
                7
            ],
            "fromEstimate": [
                9
            ],
            "toEstimate": [
                9
            ],
            "archived": [
                12
            ],
            "trashed": [
                12
            ],
            "attachmentId": [
                7
            ],
            "addedLabelIds": [
                7
            ],
            "removedLabelIds": [
                7
            ],
            "addedToReleaseIds": [
                7
            ],
            "removedFromReleaseIds": [
                7
            ],
            "relationChanges": [
                300
            ],
            "autoClosed": [
                12
            ],
            "autoArchived": [
                12
            ],
            "fromDueDate": [
                17
            ],
            "toDueDate": [
                17
            ],
            "customerNeedId": [
                7
            ],
            "changes": [
                18
            ],
            "actor": [
                6
            ],
            "actors": [
                6
            ],
            "descriptionUpdatedBy": [
                6
            ],
            "fromAssignee": [
                6
            ],
            "toAssignee": [
                6
            ],
            "fromCycle": [
                21
            ],
            "toCycle": [
                21
            ],
            "toConvertedProject": [
                110
            ],
            "fromDelegate": [
                6
            ],
            "toDelegate": [
                6
            ],
            "fromProject": [
                110
            ],
            "toProject": [
                110
            ],
            "fromState": [
                13
            ],
            "toState": [
                13
            ],
            "fromTeam": [
                11
            ],
            "toTeam": [
                11
            ],
            "fromParent": [
                16
            ],
            "toParent": [
                16
            ],
            "attachment": [
                261
            ],
            "issueImport": [
                301
            ],
            "triageResponsibilityNotifiedUsers": [
                6
            ],
            "triageResponsibilityAutoAssigned": [
                12
            ],
            "triageResponsibilityTeam": [
                11
            ],
            "fromProjectMilestone": [
                172
            ],
            "toProjectMilestone": [
                172
            ],
            "fromSlaStartedAt": [
                5
            ],
            "toSlaStartedAt": [
                5
            ],
            "fromSlaBreachesAt": [
                5
            ],
            "toSlaBreachesAt": [
                5
            ],
            "fromSlaBreached": [
                12
            ],
            "toSlaBreached": [
                12
            ],
            "fromSlaType": [
                7
            ],
            "toSlaType": [
                7
            ],
            "botActor": [
                202
            ],
            "addedLabels": [
                250
            ],
            "removedLabels": [
                250
            ],
            "addedToReleases": [
                265
            ],
            "removedFromReleases": [
                265
            ],
            "triageRuleMetadata": [
                302
            ],
            "__typename": [
                7
            ]
        },
        "IssueRelationHistoryPayload": {
            "identifier": [
                7
            ],
            "type": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueImport": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "teamName": [
                7
            ],
            "creatorId": [
                7
            ],
            "service": [
                7
            ],
            "status": [
                7
            ],
            "mapping": [
                18
            ],
            "error": [
                7
            ],
            "progress": [
                9
            ],
            "csvFileUrl": [
                7
            ],
            "errorMetadata": [
                18
            ],
            "serviceMetadata": [
                18
            ],
            "displayName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueHistoryTriageRuleMetadata": {
            "triageRuleError": [
                303
            ],
            "updatedByTriageRule": [
                305
            ],
            "__typename": [
                7
            ]
        },
        "IssueHistoryTriageRuleError": {
            "type": [
                304
            ],
            "property": [
                7
            ],
            "conflictForSameChildLabel": [
                12
            ],
            "fromTeam": [
                11
            ],
            "toTeam": [
                11
            ],
            "conflictingLabels": [
                250
            ],
            "__typename": [
                7
            ]
        },
        "TriageRuleErrorType": {},
        "WorkflowDefinition": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "groupName": [
                7
            ],
            "description": [
                7
            ],
            "type": [
                306
            ],
            "trigger": [
                307
            ],
            "triggerType": [
                308
            ],
            "conditions": [
                18
            ],
            "enabled": [
                12
            ],
            "team": [
                11
            ],
            "creator": [
                6
            ],
            "activities": [
                18
            ],
            "sortOrder": [
                7
            ],
            "lastExecutedAt": [
                5
            ],
            "lastUpdatedBy": [
                6
            ],
            "label": [
                250
            ],
            "cycle": [
                21
            ],
            "user": [
                6
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "customView": [
                215
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowType": {},
        "WorkflowTrigger": {},
        "WorkflowTriggerType": {},
        "UserContextViewType": {},
        "IssueRelationConnection": {
            "edges": [
                311
            ],
            "nodes": [
                312
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueRelationEdge": {
            "node": [
                312
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueRelation": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "issue": [
                16
            ],
            "relatedIssue": [
                16
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentConnection": {
            "edges": [
                314
            ],
            "nodes": [
                261
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentEdge": {
            "node": [
                261
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueSuggestionConnection": {
            "edges": [
                316
            ],
            "nodes": [
                317
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueSuggestionEdge": {
            "node": [
                317
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueSuggestion": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "issue": [
                16
            ],
            "issueId": [
                7
            ],
            "type": [
                318
            ],
            "state": [
                319
            ],
            "stateChangedAt": [
                5
            ],
            "dismissalReason": [
                7
            ],
            "metadata": [
                320
            ],
            "suggestedIssue": [
                16
            ],
            "suggestedIssueId": [
                7
            ],
            "suggestedTeam": [
                11
            ],
            "suggestedProject": [
                110
            ],
            "suggestedUser": [
                6
            ],
            "suggestedUserId": [
                7
            ],
            "suggestedLabel": [
                250
            ],
            "suggestedLabelId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueSuggestionType": {},
        "IssueSuggestionState": {},
        "IssueSuggestionMetadata": {
            "score": [
                9
            ],
            "classification": [
                7
            ],
            "reasons": [
                7
            ],
            "evalLogId": [
                7
            ],
            "rank": [
                9
            ],
            "variant": [
                7
            ],
            "appliedAutomationRuleId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueStateSpanConnection": {
            "edges": [
                322
            ],
            "nodes": [
                323
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueStateSpanEdge": {
            "node": [
                323
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueStateSpan": {
            "id": [
                4
            ],
            "stateId": [
                4
            ],
            "startedAt": [
                5
            ],
            "endedAt": [
                5
            ],
            "state": [
                13
            ],
            "__typename": [
                7
            ]
        },
        "CycleConnection": {
            "edges": [
                325
            ],
            "nodes": [
                21
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "CycleEdge": {
            "node": [
                21
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CycleFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "number": [
                26
            ],
            "name": [
                27
            ],
            "startsAt": [
                24
            ],
            "endsAt": [
                24
            ],
            "completedAt": [
                24
            ],
            "isActive": [
                38
            ],
            "isInCooldown": [
                38
            ],
            "isNext": [
                38
            ],
            "isPrevious": [
                38
            ],
            "isFuture": [
                38
            ],
            "isPast": [
                38
            ],
            "team": [
                51
            ],
            "issues": [
                39
            ],
            "inheritedFromId": [
                37
            ],
            "and": [
                326
            ],
            "or": [
                326
            ],
            "__typename": [
                7
            ]
        },
        "TriageResponsibility": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "action": [
                328
            ],
            "manualSelection": [
                329
            ],
            "team": [
                11
            ],
            "timeSchedule": [
                330
            ],
            "currentUser": [
                6
            ],
            "__typename": [
                7
            ]
        },
        "TriageResponsibilityAction": {},
        "TriageResponsibilityManualSelection": {
            "userIds": [
                7
            ],
            "assignmentIndex": [
                105
            ],
            "__typename": [
                7
            ]
        },
        "TimeSchedule": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "entries": [
                331
            ],
            "externalId": [
                7
            ],
            "externalUrl": [
                7
            ],
            "organization": [
                8
            ],
            "integration": [
                263
            ],
            "__typename": [
                7
            ]
        },
        "TimeScheduleEntry": {
            "startsAt": [
                5
            ],
            "endsAt": [
                5
            ],
            "userId": [
                7
            ],
            "userEmail": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TeamMembership": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "user": [
                6
            ],
            "team": [
                11
            ],
            "owner": [
                12
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "TeamMembershipConnection": {
            "edges": [
                334
            ],
            "nodes": [
                332
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "TeamMembershipEdge": {
            "node": [
                332
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStateConnection": {
            "edges": [
                336
            ],
            "nodes": [
                13
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStateEdge": {
            "node": [
                13
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationStateConnection": {
            "edges": [
                338
            ],
            "nodes": [
                339
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationStateEdge": {
            "node": [
                339
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationState": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "state": [
                13
            ],
            "team": [
                11
            ],
            "targetBranch": [
                340
            ],
            "event": [
                341
            ],
            "branchPattern": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationTargetBranch": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "team": [
                11
            ],
            "branchPattern": [
                7
            ],
            "isRegex": [
                12
            ],
            "automationStates": [
                337,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationStates": {},
        "TemplateConnection": {
            "edges": [
                343
            ],
            "nodes": [
                116
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "TemplateEdge": {
            "node": [
                116
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "WebhookConnection": {
            "edges": [
                345
            ],
            "nodes": [
                346
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "WebhookEdge": {
            "node": [
                346
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Webhook": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "label": [
                7
            ],
            "url": [
                7
            ],
            "enabled": [
                12
            ],
            "team": [
                11
            ],
            "teamIds": [
                7
            ],
            "allPublicTeams": [
                12
            ],
            "creator": [
                6
            ],
            "secret": [
                7
            ],
            "resourceTypes": [
                7
            ],
            "failures": [
                347
            ],
            "__typename": [
                7
            ]
        },
        "WebhookFailureEvent": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "webhook": [
                346
            ],
            "url": [
                7
            ],
            "httpStatus": [
                9
            ],
            "responseOrError": [
                7
            ],
            "executionId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "FacetPageSource": {},
        "OrganizationIpRestriction": {
            "range": [
                7
            ],
            "type": [
                7
            ],
            "description": [
                7
            ],
            "enabled": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseChannel": {},
        "SLADayCountType": {},
        "ProjectUpdateReminderFrequency": {},
        "IntegrationConnection": {
            "edges": [
                354
            ],
            "nodes": [
                263
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationEdge": {
            "node": [
                263
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "PaidSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "seats": [
                9
            ],
            "seatsMinimum": [
                9
            ],
            "seatsMaximum": [
                9
            ],
            "creator": [
                6
            ],
            "organization": [
                8
            ],
            "collectionMethod": [
                7
            ],
            "canceledAt": [
                5
            ],
            "cancelAt": [
                5
            ],
            "pendingChangeType": [
                7
            ],
            "nextBillingAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "IdentityProvider": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "defaultMigrated": [
                12
            ],
            "type": [
                357
            ],
            "samlEnabled": [
                12
            ],
            "ssoEndpoint": [
                7
            ],
            "ssoBinding": [
                7
            ],
            "ssoSignAlgo": [
                7
            ],
            "ssoSigningCert": [
                7
            ],
            "issuerEntityId": [
                7
            ],
            "spEntityId": [
                7
            ],
            "priority": [
                9
            ],
            "scimEnabled": [
                12
            ],
            "ownersGroupPush": [
                18
            ],
            "adminsGroupPush": [
                18
            ],
            "guestsGroupPush": [
                18
            ],
            "allowNameChange": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IdentityProviderType": {},
        "IssueDraftConnection": {
            "edges": [
                359
            ],
            "nodes": [
                360
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueDraftEdge": {
            "node": [
                360
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueDraft": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "title": [
                7
            ],
            "description": [
                7
            ],
            "priority": [
                9
            ],
            "estimate": [
                9
            ],
            "dueDate": [
                17
            ],
            "labelIds": [
                7
            ],
            "teamId": [
                7
            ],
            "cycleId": [
                7
            ],
            "projectId": [
                7
            ],
            "projectMilestoneId": [
                7
            ],
            "creator": [
                6
            ],
            "assigneeId": [
                7
            ],
            "delegateId": [
                7
            ],
            "stateId": [
                7
            ],
            "parent": [
                360
            ],
            "parentId": [
                7
            ],
            "sourceCommentId": [
                7
            ],
            "parentIssue": [
                16
            ],
            "parentIssueId": [
                7
            ],
            "subIssueSortOrder": [
                9
            ],
            "priorityLabel": [
                7
            ],
            "descriptionData": [
                117
            ],
            "attachments": [
                18
            ],
            "needs": [
                18
            ],
            "releaseIds": [
                7
            ],
            "schedule": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "DraftConnection": {
            "edges": [
                362
            ],
            "nodes": [
                363
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "DraftEdge": {
            "node": [
                363
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Draft": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "bodyData": [
                117
            ],
            "data": [
                18
            ],
            "isAutogenerated": [
                12
            ],
            "wasLocalDraft": [
                12
            ],
            "user": [
                6
            ],
            "issue": [
                16
            ],
            "project": [
                110
            ],
            "projectUpdate": [
                118
            ],
            "initiative": [
                129
            ],
            "initiativeUpdate": [
                131
            ],
            "post": [
                176
            ],
            "parentComment": [
                121
            ],
            "customerNeed": [
                260
            ],
            "anchor": [
                7
            ],
            "team": [
                11
            ],
            "__typename": [
                7
            ]
        },
        "FacetConnection": {
            "edges": [
                365
            ],
            "nodes": [
                10
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "FacetEdge": {
            "node": [
                10
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CycleNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "LabelNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TeamNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "UserNotificationSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "subscriber": [
                6
            ],
            "customer": [
                256
            ],
            "customView": [
                215
            ],
            "cycle": [
                21
            ],
            "label": [
                250
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "user": [
                6
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "active": [
                12
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueNotification": {
            "commentId": [
                7
            ],
            "parentCommentId": [
                7
            ],
            "reactionEmoji": [
                7
            ],
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "issueId": [
                7
            ],
            "issue": [
                16
            ],
            "comment": [
                121
            ],
            "parentComment": [
                121
            ],
            "team": [
                11
            ],
            "subscriptions": [
                1
            ],
            "__typename": [
                7
            ]
        },
        "Notification": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "on_IssueNotification": [
                373
            ],
            "on_ProjectNotification": [
                376
            ],
            "on_InitiativeNotification": [
                377
            ],
            "on_OauthClientApprovalNotification": [
                378
            ],
            "on_DocumentNotification": [
                381
            ],
            "on_PostNotification": [
                382
            ],
            "on_CustomerNeedNotification": [
                383
            ],
            "on_CustomerNotification": [
                384
            ],
            "on_PullRequestNotification": [
                385
            ],
            "on_WelcomeMessageNotification": [
                386
            ],
            "__typename": [
                7
            ]
        },
        "NotificationCategory": {},
        "ProjectNotification": {
            "commentId": [
                7
            ],
            "parentCommentId": [
                7
            ],
            "reactionEmoji": [
                7
            ],
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "projectId": [
                7
            ],
            "projectMilestoneId": [
                7
            ],
            "projectUpdateId": [
                7
            ],
            "project": [
                110
            ],
            "document": [
                109
            ],
            "projectUpdate": [
                118
            ],
            "comment": [
                121
            ],
            "parentComment": [
                121
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeNotification": {
            "commentId": [
                7
            ],
            "parentCommentId": [
                7
            ],
            "reactionEmoji": [
                7
            ],
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "initiativeId": [
                7
            ],
            "initiativeUpdateId": [
                7
            ],
            "initiative": [
                129
            ],
            "document": [
                109
            ],
            "initiativeUpdate": [
                131
            ],
            "comment": [
                121
            ],
            "parentComment": [
                121
            ],
            "__typename": [
                7
            ]
        },
        "OauthClientApprovalNotification": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "oauthClientApprovalId": [
                7
            ],
            "oauthClientApproval": [
                379
            ],
            "__typename": [
                7
            ]
        },
        "OauthClientApproval": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "oauthClientId": [
                7
            ],
            "requesterId": [
                7
            ],
            "responderId": [
                7
            ],
            "status": [
                380
            ],
            "scopes": [
                7
            ],
            "requestReason": [
                7
            ],
            "denyReason": [
                7
            ],
            "newlyRequestedScopes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OAuthClientApprovalStatus": {},
        "DocumentNotification": {
            "commentId": [
                7
            ],
            "parentCommentId": [
                7
            ],
            "reactionEmoji": [
                7
            ],
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "documentId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "PostNotification": {
            "commentId": [
                7
            ],
            "parentCommentId": [
                7
            ],
            "reactionEmoji": [
                7
            ],
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "postId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedNotification": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "customerNeedId": [
                7
            ],
            "relatedIssue": [
                16
            ],
            "relatedProject": [
                110
            ],
            "customerNeed": [
                260
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNotification": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "customerId": [
                7
            ],
            "customer": [
                256
            ],
            "__typename": [
                7
            ]
        },
        "PullRequestNotification": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "pullRequestId": [
                7
            ],
            "pullRequestCommentId": [
                7
            ],
            "pullRequest": [
                123
            ],
            "__typename": [
                7
            ]
        },
        "WelcomeMessageNotification": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "actor": [
                6
            ],
            "externalUserActor": [
                179
            ],
            "user": [
                6
            ],
            "readAt": [
                5
            ],
            "emailedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "unsnoozedAt": [
                5
            ],
            "category": [
                375
            ],
            "url": [
                7
            ],
            "inboxUrl": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "isLinearActor": [
                12
            ],
            "actorAvatarUrl": [
                7
            ],
            "actorInitials": [
                7
            ],
            "actorAvatarColor": [
                7
            ],
            "issueStatusType": [
                7
            ],
            "projectUpdateHealth": [
                7
            ],
            "initiativeUpdateHealth": [
                7
            ],
            "groupingKey": [
                7
            ],
            "groupingPriority": [
                9
            ],
            "botActor": [
                202
            ],
            "welcomeMessageId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Query": {
            "workflowStates": [
                335,
                {
                    "filter": [
                        91
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "workflowState": [
                13,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "webhooks": [
                344,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "webhook": [
                346,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "failuresForOauthWebhooks": [
                347,
                {
                    "oauthClientId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userSettings": [
                388
            ],
            "users": [
                278,
                {
                    "filter": [
                        49
                    ],
                    "includeDisabled": [
                        12
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        401,
                        "[UserSortInput!]"
                    ]
                }
            ],
            "user": [
                6,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "viewer": [
                6
            ],
            "userSessions": [
                404,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "triageResponsibilities": [
                406,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "triageResponsibility": [
                327,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "timeSchedules": [
                408,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "timeSchedule": [
                330,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "templates": [
                116
            ],
            "template": [
                116,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "templatesForIntegration": [
                116,
                {
                    "integrationType": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projects": [
                136,
                {
                    "filter": [
                        73
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        138,
                        "[ProjectSortInput!]"
                    ]
                }
            ],
            "project": [
                110,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectFilterSuggestion": [
                410,
                {
                    "prompt": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teams": [
                276,
                {
                    "filter": [
                        51
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "administrableTeams": [
                276,
                {
                    "filter": [
                        51
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "team": [
                11,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamMemberships": [
                333,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "teamMembership": [
                332,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "semanticSearch": [
                411,
                {
                    "query": [
                        7,
                        "String!"
                    ],
                    "types": [
                        413,
                        "[SemanticSearchResultType!]"
                    ],
                    "maxResults": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "filters": [
                        414
                    ]
                }
            ],
            "searchDocuments": [
                415,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "term": [
                        7,
                        "String!"
                    ],
                    "includeComments": [
                        12
                    ],
                    "teamId": [
                        7
                    ]
                }
            ],
            "searchProjects": [
                419,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "term": [
                        7,
                        "String!"
                    ],
                    "includeComments": [
                        12
                    ],
                    "teamId": [
                        7
                    ]
                }
            ],
            "searchIssues": [
                422,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "term": [
                        7,
                        "String!"
                    ],
                    "includeComments": [
                        12
                    ],
                    "teamId": [
                        7
                    ]
                }
            ],
            "roadmapToProjects": [
                425,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "roadmapToProject": [
                427,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "roadmaps": [
                429,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "roadmap": [
                428,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseStages": [
                268,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "releaseStage": [
                270,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releases": [
                271,
                {
                    "filter": [
                        102
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "release": [
                265,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseSearch": [
                265,
                {
                    "first": [
                        105
                    ],
                    "term": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releasePipelines": [
                431,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "releasePipeline": [
                266,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releasePipelineByAccessKey": [
                266
            ],
            "latestReleaseByAccessKey": [
                265
            ],
            "rateLimitStatus": [
                433
            ],
            "pushSubscriptionTest": [
                435,
                {
                    "targetMobile": [
                        12
                    ],
                    "sendStrategy": [
                        436
                    ]
                }
            ],
            "projectUpdates": [
                280,
                {
                    "filter": [
                        246
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectUpdate": [
                118,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectStatuses": [
                437,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectStatusProjectCount": [
                439,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectStatus": [
                113,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectRelations": [
                289,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectRelation": [
                291,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectMilestones": [
                282,
                {
                    "filter": [
                        69
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectMilestone": [
                172,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectLabels": [
                254,
                {
                    "filter": [
                        57
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectLabel": [
                253,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organization": [
                8
            ],
            "organizationExists": [
                440,
                {
                    "urlKey": [
                        7,
                        "String!"
                    ]
                }
            ],
            "archivedTeams": [
                11
            ],
            "organizationMeta": [
                441,
                {
                    "urlKey": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationInvites": [
                442,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "organizationInvite": [
                444,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationInviteDetails": [
                446,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationDomainClaimRequest": [
                450,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "notificationSubscriptions": [
                451,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "notificationSubscription": [
                1,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "notifications": [
                453,
                {
                    "filter": [
                        455
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "notificationsUnreadCount": [
                105
            ],
            "notification": [
                374,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueToReleases": [
                456,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issueToRelease": [
                458,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        216,
                        "[IssueSortInput!]"
                    ]
                }
            ],
            "issue": [
                16,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueSearch": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "query": [
                        7
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issueVcsBranchSearch": [
                16,
                {
                    "branchName": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueFigmaFileKeySearch": [
                14,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "fileKey": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issuePriorityValues": [
                459
            ],
            "issueFilterSuggestion": [
                460,
                {
                    "projectId": [
                        7
                    ],
                    "prompt": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueRepositorySuggestions": [
                461,
                {
                    "agentSessionId": [
                        7
                    ],
                    "candidateRepositories": [
                        463,
                        "[CandidateRepository!]!"
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueRelations": [
                310,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issueRelation": [
                312,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueLabels": [
                251,
                {
                    "filter": [
                        47
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issueLabel": [
                250,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueImportCheckCSV": [
                464,
                {
                    "csvUrl": [
                        7,
                        "String!"
                    ],
                    "service": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueImportCheckSync": [
                465,
                {
                    "issueImportId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueImportJqlCheck": [
                466,
                {
                    "jiraHostname": [
                        7,
                        "String!"
                    ],
                    "jiraToken": [
                        7,
                        "String!"
                    ],
                    "jiraEmail": [
                        7,
                        "String!"
                    ],
                    "jiraProject": [
                        7,
                        "String!"
                    ],
                    "jql": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationsSettings": [
                154,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationTemplates": [
                467,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "integrationTemplate": [
                469,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrations": [
                353,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "integration": [
                263,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "verifyGitHubEnterpriseServerInstallation": [
                470,
                {
                    "integrationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationHasScopes": [
                471,
                {
                    "scopes": [
                        7,
                        "[String!]!"
                    ],
                    "integrationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeUpdates": [
                159,
                {
                    "filter": [
                        472
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "initiativeUpdate": [
                131,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeToProjects": [
                273,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "initiativeToProject": [
                275,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiatives": [
                161,
                {
                    "filter": [
                        67
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        163,
                        "[InitiativeSortInput!]"
                    ]
                }
            ],
            "initiative": [
                129,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeRelations": [
                473,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "initiativeRelation": [
                291,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "fetchData": [
                476,
                {
                    "query": [
                        7,
                        "String!"
                    ]
                }
            ],
            "favorites": [
                213,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "favorite": [
                210,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "externalUsers": [
                477,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "externalUser": [
                179,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "entityExternalLink": [
                153,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "emojis": [
                479,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "emoji": [
                481,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "emailIntakeAddress": [
                482,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "document": [
                109,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "documentContentHistory": [
                486,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "cycles": [
                324,
                {
                    "filter": [
                        326
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "cycle": [
                21,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerTiers": [
                488,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "customerTier": [
                259,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerStatuses": [
                490,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "customerStatus": [
                257,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customers": [
                492,
                {
                    "filter": [
                        494
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sorts": [
                        495,
                        "[CustomerSortInput!]"
                    ]
                }
            ],
            "customer": [
                256,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerNeeds": [
                292,
                {
                    "filter": [
                        83
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "customerNeed": [
                260,
                {
                    "id": [
                        7
                    ],
                    "hash": [
                        7
                    ]
                }
            ],
            "issueTitleSuggestionFromCustomerRequest": [
                504,
                {
                    "request": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customViews": [
                505,
                {
                    "filter": [
                        507
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "sort": [
                        508,
                        "[CustomViewSortInput!]"
                    ]
                }
            ],
            "customView": [
                215,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customViewDetailsSuggestion": [
                513,
                {
                    "modelName": [
                        7
                    ],
                    "filter": [
                        18,
                        "JSONObject!"
                    ]
                }
            ],
            "customViewHasSubscribers": [
                514,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "comment": [
                121,
                {
                    "id": [
                        7
                    ],
                    "hash": [
                        7
                    ]
                }
            ],
            "availableUsers": [
                515
            ],
            "authenticationSessions": [
                404
            ],
            "ssoUrlFromEmail": [
                519,
                {
                    "isDesktop": [
                        12
                    ],
                    "type": [
                        357,
                        "IdentityProviderType!"
                    ],
                    "email": [
                        7,
                        "String!"
                    ]
                }
            ],
            "auditEntryTypes": [
                520
            ],
            "auditEntries": [
                521,
                {
                    "filter": [
                        524
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "attachments": [
                313,
                {
                    "filter": [
                        94
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "attachment": [
                261,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentsForURL": [
                313,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ],
                    "url": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentIssue": [
                16,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentSources": [
                525,
                {
                    "teamId": [
                        7
                    ]
                }
            ],
            "applicationInfo": [
                526,
                {
                    "clientId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "agentSessions": [
                200,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "agentSession": [
                180,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "agentSessionSandbox": [
                527,
                {
                    "agentSessionId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "agentActivities": [
                182,
                {
                    "filter": [
                        194
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "agentActivity": [
                184,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "UserSettings": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "notificationDeliveryPreferences": [
                389
            ],
            "unsubscribedFrom": [
                7
            ],
            "user": [
                6
            ],
            "calendarHash": [
                7
            ],
            "subscribedToChangelog": [
                12
            ],
            "subscribedToDPA": [
                12
            ],
            "subscribedToInviteAccepted": [
                12
            ],
            "subscribedToPrivacyLegalUpdates": [
                12
            ],
            "feedSummarySchedule": [
                178
            ],
            "showFullUserNames": [
                12
            ],
            "feedLastSeenTime": [
                5
            ],
            "autoAssignToSelf": [
                12
            ],
            "notificationCategoryPreferences": [
                393
            ],
            "notificationChannelPreferences": [
                394
            ],
            "theme": [
                395,
                {
                    "deviceType": [
                        399
                    ],
                    "mode": [
                        400
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferences": {
            "mobile": [
                390
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferencesChannel": {
            "notificationsDisabled": [
                12
            ],
            "schedule": [
                391
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferencesSchedule": {
            "disabled": [
                12
            ],
            "sunday": [
                392
            ],
            "monday": [
                392
            ],
            "tuesday": [
                392
            ],
            "wednesday": [
                392
            ],
            "thursday": [
                392
            ],
            "friday": [
                392
            ],
            "saturday": [
                392
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferencesDay": {
            "start": [
                7
            ],
            "end": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotificationCategoryPreferences": {
            "assignments": [
                394
            ],
            "statusChanges": [
                394
            ],
            "commentsAndReplies": [
                394
            ],
            "mentions": [
                394
            ],
            "reactions": [
                394
            ],
            "subscriptions": [
                394
            ],
            "documentChanges": [
                394
            ],
            "postsAndUpdates": [
                394
            ],
            "reminders": [
                394
            ],
            "reviews": [
                394
            ],
            "appsAndIntegrations": [
                394
            ],
            "system": [
                394
            ],
            "triage": [
                394
            ],
            "customers": [
                394
            ],
            "feed": [
                394
            ],
            "__typename": [
                7
            ]
        },
        "NotificationChannelPreferences": {
            "mobile": [
                12
            ],
            "desktop": [
                12
            ],
            "email": [
                12
            ],
            "slack": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "UserSettingsTheme": {
            "preset": [
                396
            ],
            "custom": [
                397
            ],
            "__typename": [
                7
            ]
        },
        "UserSettingsThemePreset": {},
        "UserSettingsCustomTheme": {
            "accent": [
                9
            ],
            "base": [
                9
            ],
            "contrast": [
                105
            ],
            "sidebar": [
                398
            ],
            "__typename": [
                7
            ]
        },
        "UserSettingsCustomSidebarTheme": {
            "accent": [
                9
            ],
            "base": [
                9
            ],
            "contrast": [
                105
            ],
            "__typename": [
                7
            ]
        },
        "UserSettingsThemeDeviceType": {},
        "UserSettingsThemeMode": {},
        "UserSortInput": {
            "name": [
                402
            ],
            "displayName": [
                403
            ],
            "__typename": [
                7
            ]
        },
        "UserNameSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "UserDisplayNameSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "AuthenticationSessionResponse": {
            "createdAt": [
                5
            ],
            "id": [
                7
            ],
            "type": [
                405
            ],
            "ip": [
                7
            ],
            "locationCountry": [
                7
            ],
            "locationCountryCode": [
                7
            ],
            "countryCodes": [
                7
            ],
            "locationRegionCode": [
                7
            ],
            "locationCity": [
                7
            ],
            "userAgent": [
                7
            ],
            "browserType": [
                7
            ],
            "service": [
                7
            ],
            "lastActiveAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "location": [
                7
            ],
            "operatingSystem": [
                7
            ],
            "client": [
                7
            ],
            "name": [
                7
            ],
            "isCurrentSession": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AuthenticationSessionType": {},
        "TriageResponsibilityConnection": {
            "edges": [
                407
            ],
            "nodes": [
                327
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "TriageResponsibilityEdge": {
            "node": [
                327
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TimeScheduleConnection": {
            "edges": [
                409
            ],
            "nodes": [
                330
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "TimeScheduleEdge": {
            "node": [
                330
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectFilterSuggestionPayload": {
            "filter": [
                18
            ],
            "logId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "SemanticSearchPayload": {
            "enabled": [
                12
            ],
            "results": [
                412
            ],
            "__typename": [
                7
            ]
        },
        "SemanticSearchResult": {
            "id": [
                4
            ],
            "type": [
                413
            ],
            "issue": [
                16
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "document": [
                109
            ],
            "__typename": [
                7
            ]
        },
        "SemanticSearchResultType": {},
        "SemanticSearchFilters": {
            "issues": [
                22
            ],
            "projects": [
                73
            ],
            "initiatives": [
                67
            ],
            "documents": [
                77
            ],
            "__typename": [
                7
            ]
        },
        "DocumentSearchPayload": {
            "edges": [
                416
            ],
            "nodes": [
                417
            ],
            "pageInfo": [
                135
            ],
            "archivePayload": [
                418
            ],
            "totalCount": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "DocumentSearchResultEdge": {
            "node": [
                417
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "DocumentSearchResult": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "title": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "creator": [
                6
            ],
            "updatedBy": [
                6
            ],
            "project": [
                110
            ],
            "initiative": [
                129
            ],
            "team": [
                11
            ],
            "issue": [
                16
            ],
            "release": [
                265
            ],
            "cycle": [
                21
            ],
            "slugId": [
                7
            ],
            "lastAppliedTemplate": [
                116
            ],
            "hiddenAt": [
                5
            ],
            "trashed": [
                12
            ],
            "sortOrder": [
                9
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "content": [
                7
            ],
            "contentState": [
                7
            ],
            "documentContentId": [
                7
            ],
            "url": [
                7
            ],
            "metadata": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "ArchiveResponse": {
            "archive": [
                7
            ],
            "totalCount": [
                9
            ],
            "databaseVersion": [
                9
            ],
            "includesDependencies": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectSearchPayload": {
            "edges": [
                420
            ],
            "nodes": [
                421
            ],
            "pageInfo": [
                135
            ],
            "archivePayload": [
                418
            ],
            "totalCount": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "ProjectSearchResultEdge": {
            "node": [
                421
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectSearchResult": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "updateReminderFrequencyInWeeks": [
                9
            ],
            "updateReminderFrequency": [
                9
            ],
            "frequencyResolution": [
                111
            ],
            "updateRemindersDay": [
                112
            ],
            "updateRemindersHour": [
                9
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "slugId": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "status": [
                113
            ],
            "creator": [
                6
            ],
            "lead": [
                6
            ],
            "facets": [
                10
            ],
            "projectUpdateRemindersPausedUntilAt": [
                5
            ],
            "startDate": [
                17
            ],
            "startDateResolution": [
                115
            ],
            "targetDate": [
                17
            ],
            "targetDateResolution": [
                115
            ],
            "startedAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "canceledAt": [
                5
            ],
            "autoArchivedAt": [
                5
            ],
            "trashed": [
                12
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "convertedFromIssue": [
                16
            ],
            "lastAppliedTemplate": [
                116
            ],
            "priority": [
                105
            ],
            "lastUpdate": [
                118
            ],
            "health": [
                119
            ],
            "healthUpdatedAt": [
                5
            ],
            "issueCountHistory": [
                9
            ],
            "completedIssueCountHistory": [
                9
            ],
            "scopeHistory": [
                9
            ],
            "completedScopeHistory": [
                9
            ],
            "inProgressScopeHistory": [
                9
            ],
            "progressHistory": [
                18
            ],
            "currentProgress": [
                18
            ],
            "slackNewIssue": [
                12
            ],
            "slackIssueComments": [
                12
            ],
            "slackIssueStatuses": [
                12
            ],
            "labelIds": [
                7
            ],
            "favorite": [
                210
            ],
            "url": [
                7
            ],
            "initiatives": [
                161,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "initiativeToProjects": [
                273,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "teams": [
                276,
                {
                    "filter": [
                        51
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "members": [
                278,
                {
                    "filter": [
                        49
                    ],
                    "includeDisabled": [
                        12
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectUpdates": [
                280,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "projectMilestones": [
                282,
                {
                    "filter": [
                        69
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "issues": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "externalLinks": [
                151,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "attachments": [
                284,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "history": [
                286,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "labels": [
                254,
                {
                    "filter": [
                        57
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "progress": [
                9
            ],
            "scope": [
                9
            ],
            "integrationsSettings": [
                154
            ],
            "content": [
                7
            ],
            "contentState": [
                7
            ],
            "documentContent": [
                122
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "relations": [
                289,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "inverseRelations": [
                289,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "needs": [
                292,
                {
                    "filter": [
                        83
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "state": [
                7
            ],
            "priorityLabel": [
                7
            ],
            "syncedWith": [
                204
            ],
            "metadata": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "IssueSearchPayload": {
            "edges": [
                423
            ],
            "nodes": [
                424
            ],
            "pageInfo": [
                135
            ],
            "archivePayload": [
                418
            ],
            "totalCount": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "IssueSearchResultEdge": {
            "node": [
                424
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueSearchResult": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "number": [
                9
            ],
            "title": [
                7
            ],
            "priority": [
                9
            ],
            "estimate": [
                9
            ],
            "boardOrder": [
                9
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "startedAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "startedTriageAt": [
                5
            ],
            "triagedAt": [
                5
            ],
            "canceledAt": [
                5
            ],
            "autoClosedAt": [
                5
            ],
            "autoArchivedAt": [
                5
            ],
            "dueDate": [
                17
            ],
            "slaStartedAt": [
                5
            ],
            "slaMediumRiskAt": [
                5
            ],
            "slaHighRiskAt": [
                5
            ],
            "slaBreachesAt": [
                5
            ],
            "slaType": [
                7
            ],
            "addedToProjectAt": [
                5
            ],
            "addedToCycleAt": [
                5
            ],
            "addedToTeamAt": [
                5
            ],
            "trashed": [
                12
            ],
            "snoozedUntilAt": [
                5
            ],
            "suggestionsGeneratedAt": [
                5
            ],
            "activitySummary": [
                18
            ],
            "summary": [
                19
            ],
            "labelIds": [
                7
            ],
            "team": [
                11
            ],
            "cycle": [
                21
            ],
            "project": [
                110
            ],
            "projectMilestone": [
                172
            ],
            "lastAppliedTemplate": [
                116
            ],
            "recurringIssueTemplate": [
                116
            ],
            "previousIdentifiers": [
                7
            ],
            "creator": [
                6
            ],
            "externalUserCreator": [
                179
            ],
            "assignee": [
                6
            ],
            "delegate": [
                6
            ],
            "snoozedBy": [
                6
            ],
            "state": [
                13
            ],
            "subIssueSortOrder": [
                9
            ],
            "reactionData": [
                18
            ],
            "priorityLabel": [
                7
            ],
            "sourceComment": [
                121
            ],
            "integrationSourceType": [
                294
            ],
            "documents": [
                107,
                {
                    "filter": [
                        77
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "botActor": [
                202
            ],
            "favorite": [
                210
            ],
            "identifier": [
                7
            ],
            "url": [
                7
            ],
            "branchName": [
                7
            ],
            "sharedAccess": [
                295
            ],
            "customerTicketCount": [
                105
            ],
            "subscribers": [
                278,
                {
                    "filter": [
                        49
                    ],
                    "includeDisabled": [
                        12
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "parent": [
                16
            ],
            "children": [
                14,
                {
                    "filter": [
                        22
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "comments": [
                133,
                {
                    "filter": [
                        85
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "history": [
                297,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "labels": [
                251,
                {
                    "filter": [
                        47
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "relations": [
                310,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "inverseRelations": [
                310,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "attachments": [
                313,
                {
                    "filter": [
                        94
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "formerAttachments": [
                313,
                {
                    "filter": [
                        94
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "description": [
                7
            ],
            "descriptionState": [
                7
            ],
            "documentContent": [
                122
            ],
            "reactions": [
                120
            ],
            "needs": [
                292,
                {
                    "filter": [
                        83
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "formerNeeds": [
                292,
                {
                    "filter": [
                        83
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "syncedWith": [
                204
            ],
            "suggestions": [
                315,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "incomingSuggestions": [
                315,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "asksRequester": [
                6
            ],
            "asksExternalUserRequester": [
                179
            ],
            "stateHistory": [
                321,
                {
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ]
                }
            ],
            "metadata": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapToProjectConnection": {
            "edges": [
                426
            ],
            "nodes": [
                427
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapToProjectEdge": {
            "node": [
                427
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapToProject": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "project": [
                110
            ],
            "roadmap": [
                428
            ],
            "sortOrder": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Roadmap": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "organization": [
                8
            ],
            "creator": [
                6
            ],
            "owner": [
                6
            ],
            "slugId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "color": [
                7
            ],
            "projects": [
                136,
                {
                    "filter": [
                        73
                    ],
                    "before": [
                        7
                    ],
                    "after": [
                        7
                    ],
                    "first": [
                        105
                    ],
                    "last": [
                        105
                    ],
                    "includeArchived": [
                        12
                    ],
                    "orderBy": [
                        106
                    ]
                }
            ],
            "url": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapConnection": {
            "edges": [
                430
            ],
            "nodes": [
                428
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapEdge": {
            "node": [
                428
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelineConnection": {
            "edges": [
                432
            ],
            "nodes": [
                266
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelineEdge": {
            "node": [
                266
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "RateLimitPayload": {
            "identifier": [
                7
            ],
            "kind": [
                7
            ],
            "limits": [
                434
            ],
            "__typename": [
                7
            ]
        },
        "RateLimitResultPayload": {
            "type": [
                7
            ],
            "requestedAmount": [
                9
            ],
            "allowedAmount": [
                9
            ],
            "period": [
                9
            ],
            "remainingAmount": [
                9
            ],
            "reset": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "PushSubscriptionTestPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SendStrategy": {},
        "ProjectStatusConnection": {
            "edges": [
                438
            ],
            "nodes": [
                113
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusEdge": {
            "node": [
                113
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusCountPayload": {
            "count": [
                9
            ],
            "privateCount": [
                9
            ],
            "archivedTeamCount": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationExistsPayload": {
            "success": [
                12
            ],
            "exists": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationMeta": {
            "region": [
                7
            ],
            "allowedAuthServices": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInviteConnection": {
            "edges": [
                443
            ],
            "nodes": [
                444
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInviteEdge": {
            "node": [
                444
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInvite": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "email": [
                7
            ],
            "role": [
                445
            ],
            "external": [
                12
            ],
            "acceptedAt": [
                5
            ],
            "expiresAt": [
                5
            ],
            "metadata": [
                18
            ],
            "inviter": [
                6
            ],
            "invitee": [
                6
            ],
            "organization": [
                8
            ],
            "__typename": [
                7
            ]
        },
        "UserRoleType": {},
        "OrganizationInviteDetailsPayload": {
            "on_OrganizationInviteFullDetailsPayload": [
                447
            ],
            "on_OrganizationAcceptedOrExpiredInviteDetailsPayload": [
                449
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInviteFullDetailsPayload": {
            "status": [
                448
            ],
            "inviter": [
                7
            ],
            "email": [
                7
            ],
            "role": [
                445
            ],
            "createdAt": [
                5
            ],
            "organizationName": [
                7
            ],
            "organizationId": [
                7
            ],
            "organizationLogoUrl": [
                7
            ],
            "accepted": [
                12
            ],
            "expired": [
                12
            ],
            "allowedAuthServices": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInviteStatus": {},
        "OrganizationAcceptedOrExpiredInviteDetailsPayload": {
            "status": [
                448
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDomainClaimPayload": {
            "verificationString": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotificationSubscriptionConnection": {
            "edges": [
                452
            ],
            "nodes": [
                1
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "NotificationSubscriptionEdge": {
            "node": [
                1
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotificationConnection": {
            "edges": [
                454
            ],
            "nodes": [
                374
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "NotificationEdge": {
            "node": [
                374
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotificationFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "type": [
                27
            ],
            "archivedAt": [
                24
            ],
            "and": [
                455
            ],
            "or": [
                455
            ],
            "__typename": [
                7
            ]
        },
        "IssueToReleaseConnection": {
            "edges": [
                457
            ],
            "nodes": [
                458
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IssueToReleaseEdge": {
            "node": [
                458
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueToRelease": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "issue": [
                16
            ],
            "release": [
                265
            ],
            "pullRequest": [
                123
            ],
            "__typename": [
                7
            ]
        },
        "IssuePriorityValue": {
            "priority": [
                105
            ],
            "label": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueFilterSuggestionPayload": {
            "filter": [
                18
            ],
            "logId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "RepositorySuggestionsPayload": {
            "suggestions": [
                462
            ],
            "__typename": [
                7
            ]
        },
        "RepositorySuggestion": {
            "repositoryFullName": [
                7
            ],
            "hostname": [
                7
            ],
            "confidence": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "CandidateRepository": {
            "repositoryFullName": [
                7
            ],
            "hostname": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueImportCheckPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueImportSyncCheckPayload": {
            "canSync": [
                12
            ],
            "error": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueImportJqlCheckPayload": {
            "success": [
                12
            ],
            "count": [
                9
            ],
            "error": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationTemplateConnection": {
            "edges": [
                468
            ],
            "nodes": [
                469
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationTemplateEdge": {
            "node": [
                469
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationTemplate": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "template": [
                116
            ],
            "integration": [
                263
            ],
            "foreignEntityId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitHubEnterpriseServerInstallVerificationPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationHasScopesPayload": {
            "hasAllScopes": [
                12
            ],
            "missingScopes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "user": [
                49
            ],
            "initiative": [
                67
            ],
            "reactions": [
                74
            ],
            "and": [
                472
            ],
            "or": [
                472
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeRelationConnection": {
            "edges": [
                474
            ],
            "nodes": [
                475
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeRelationEdge": {
            "node": [
                475
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeRelation": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "initiative": [
                129
            ],
            "relatedInitiative": [
                129
            ],
            "user": [
                6
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "FetchDataPayload": {
            "data": [
                18
            ],
            "query": [
                7
            ],
            "filters": [
                18
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ExternalUserConnection": {
            "edges": [
                478
            ],
            "nodes": [
                179
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "ExternalUserEdge": {
            "node": [
                179
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EmojiConnection": {
            "edges": [
                480
            ],
            "nodes": [
                481
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "EmojiEdge": {
            "node": [
                481
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "Emoji": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "name": [
                7
            ],
            "url": [
                7
            ],
            "source": [
                7
            ],
            "creator": [
                6
            ],
            "organization": [
                8
            ],
            "__typename": [
                7
            ]
        },
        "EmailIntakeAddress": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "address": [
                7
            ],
            "type": [
                483
            ],
            "forwardingEmailAddress": [
                7
            ],
            "senderName": [
                7
            ],
            "enabled": [
                12
            ],
            "repliesEnabled": [
                12
            ],
            "useUserNamesInReplies": [
                12
            ],
            "template": [
                116
            ],
            "team": [
                11
            ],
            "organization": [
                8
            ],
            "sesDomainIdentity": [
                484
            ],
            "creator": [
                6
            ],
            "customerRequestsEnabled": [
                12
            ],
            "issueCreatedAutoReply": [
                7
            ],
            "issueCreatedAutoReplyEnabled": [
                12
            ],
            "issueCompletedAutoReplyEnabled": [
                12
            ],
            "issueCompletedAutoReply": [
                7
            ],
            "issueCanceledAutoReplyEnabled": [
                12
            ],
            "issueCanceledAutoReply": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EmailIntakeAddressType": {},
        "SesDomainIdentity": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "domain": [
                7
            ],
            "region": [
                7
            ],
            "organization": [
                8
            ],
            "creator": [
                6
            ],
            "canSendFromCustomDomain": [
                12
            ],
            "dnsRecords": [
                485
            ],
            "__typename": [
                7
            ]
        },
        "SesDomainIdentityDnsRecord": {
            "type": [
                7
            ],
            "name": [
                7
            ],
            "content": [
                7
            ],
            "isVerified": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "DocumentContentHistoryPayload": {
            "history": [
                487
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "DocumentContentHistoryType": {
            "id": [
                7
            ],
            "createdAt": [
                5
            ],
            "contentDataSnapshotAt": [
                5
            ],
            "contentData": [
                117
            ],
            "actorIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerTierConnection": {
            "edges": [
                489
            ],
            "nodes": [
                259
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "CustomerTierEdge": {
            "node": [
                259
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusConnection": {
            "edges": [
                491
            ],
            "nodes": [
                257
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusEdge": {
            "node": [
                257
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerConnection": {
            "edges": [
                493
            ],
            "nodes": [
                256
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "CustomerEdge": {
            "node": [
                256
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "slackChannelId": [
                27
            ],
            "domains": [
                79
            ],
            "externalIds": [
                79
            ],
            "owner": [
                36
            ],
            "needs": [
                70
            ],
            "revenue": [
                26
            ],
            "size": [
                26
            ],
            "status": [
                81
            ],
            "tier": [
                82
            ],
            "and": [
                494
            ],
            "or": [
                494
            ],
            "__typename": [
                7
            ]
        },
        "CustomerSortInput": {
            "name": [
                496
            ],
            "createdAt": [
                497
            ],
            "owner": [
                498
            ],
            "status": [
                499
            ],
            "revenue": [
                500
            ],
            "size": [
                501
            ],
            "tier": [
                502
            ],
            "approximateNeedCount": [
                503
            ],
            "__typename": [
                7
            ]
        },
        "NameSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomerCreatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "OwnerSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "RevenueSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "SizeSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "TierSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "ApproximateNeedCountSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "IssueTitleSuggestionFromCustomerRequestPayload": {
            "lastSyncId": [
                9
            ],
            "title": [
                7
            ],
            "logId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewConnection": {
            "edges": [
                506
            ],
            "nodes": [
                215
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewEdge": {
            "node": [
                215
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "name": [
                27
            ],
            "modelName": [
                27
            ],
            "team": [
                46
            ],
            "creator": [
                49
            ],
            "shared": [
                38
            ],
            "hasFacet": [
                12
            ],
            "and": [
                507
            ],
            "or": [
                507
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewSortInput": {
            "name": [
                509
            ],
            "createdAt": [
                510
            ],
            "shared": [
                511
            ],
            "updatedAt": [
                512
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewNameSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewCreatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewSharedSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewUpdatedAtSort": {
            "nulls": [
                140
            ],
            "order": [
                141
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewSuggestionPayload": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewHasSubscribersPayload": {
            "hasSubscribers": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AuthResolverResponse": {
            "id": [
                7
            ],
            "email": [
                7
            ],
            "allowDomainAccess": [
                12
            ],
            "users": [
                516
            ],
            "lockedUsers": [
                516
            ],
            "availableOrganizations": [
                517
            ],
            "lockedOrganizations": [
                517
            ],
            "lastUsedOrganizationId": [
                7
            ],
            "service": [
                7
            ],
            "token": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AuthUser": {
            "createdAt": [
                5
            ],
            "id": [
                4
            ],
            "name": [
                7
            ],
            "displayName": [
                7
            ],
            "email": [
                7
            ],
            "avatarUrl": [
                7
            ],
            "role": [
                445
            ],
            "active": [
                12
            ],
            "userAccountId": [
                7
            ],
            "organization": [
                517
            ],
            "identityProvider": [
                518
            ],
            "__typename": [
                7
            ]
        },
        "AuthOrganization": {
            "createdAt": [
                5
            ],
            "id": [
                4
            ],
            "name": [
                7
            ],
            "enabled": [
                12
            ],
            "urlKey": [
                7
            ],
            "previousUrlKeys": [
                7
            ],
            "logoUrl": [
                7
            ],
            "deletionRequestedAt": [
                5
            ],
            "releaseChannel": [
                350
            ],
            "samlEnabled": [
                12
            ],
            "samlSettings": [
                18
            ],
            "allowedAuthServices": [
                7
            ],
            "scimEnabled": [
                12
            ],
            "serviceId": [
                7
            ],
            "region": [
                7
            ],
            "hideNonPrimaryOrganizations": [
                12
            ],
            "userCount": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "AuthIdentityProvider": {
            "createdAt": [
                5
            ],
            "id": [
                4
            ],
            "defaultMigrated": [
                12
            ],
            "type": [
                357
            ],
            "samlEnabled": [
                12
            ],
            "ssoEndpoint": [
                7
            ],
            "ssoBinding": [
                7
            ],
            "ssoSignAlgo": [
                7
            ],
            "issuerEntityId": [
                7
            ],
            "spEntityId": [
                7
            ],
            "ssoSigningCert": [
                7
            ],
            "priority": [
                9
            ],
            "scimEnabled": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SsoUrlFromEmailResponse": {
            "success": [
                12
            ],
            "samlSsoUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AuditEntryType": {
            "type": [
                7
            ],
            "description": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AuditEntryConnection": {
            "edges": [
                522
            ],
            "nodes": [
                523
            ],
            "pageInfo": [
                135
            ],
            "__typename": [
                7
            ]
        },
        "AuditEntryEdge": {
            "node": [
                523
            ],
            "cursor": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AuditEntry": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "type": [
                7
            ],
            "organization": [
                8
            ],
            "actor": [
                6
            ],
            "actorId": [
                7
            ],
            "ip": [
                7
            ],
            "countryCode": [
                7
            ],
            "metadata": [
                18
            ],
            "requestInformation": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AuditEntryFilter": {
            "id": [
                37
            ],
            "createdAt": [
                24
            ],
            "updatedAt": [
                24
            ],
            "type": [
                27
            ],
            "ip": [
                27
            ],
            "countryCode": [
                27
            ],
            "actor": [
                36
            ],
            "and": [
                524
            ],
            "or": [
                524
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentSourcesPayload": {
            "sources": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "Application": {
            "id": [
                7
            ],
            "clientId": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "developer": [
                7
            ],
            "developerUrl": [
                7
            ],
            "imageUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CodingAgentSandboxPayload": {
            "id": [
                7
            ],
            "agentSessionId": [
                7
            ],
            "organizationId": [
                7
            ],
            "creatorId": [
                7
            ],
            "sandboxUrl": [
                7
            ],
            "sandboxLogsUrl": [
                7
            ],
            "datadogLogsUrl": [
                7
            ],
            "workerConversationId": [
                7
            ],
            "repository": [
                7
            ],
            "branchName": [
                7
            ],
            "baseRef": [
                7
            ],
            "createdAt": [
                5
            ],
            "startedAt": [
                5
            ],
            "endedAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "Mutation": {
            "fileUpload": [
                529,
                {
                    "metaData": [
                        117
                    ],
                    "makePublic": [
                        12
                    ],
                    "size": [
                        105,
                        "Int!"
                    ],
                    "contentType": [
                        7,
                        "String!"
                    ],
                    "filename": [
                        7,
                        "String!"
                    ]
                }
            ],
            "importFileUpload": [
                529,
                {
                    "metaData": [
                        117
                    ],
                    "size": [
                        105,
                        "Int!"
                    ],
                    "contentType": [
                        7,
                        "String!"
                    ],
                    "filename": [
                        7,
                        "String!"
                    ]
                }
            ],
            "imageUploadFromUrl": [
                532,
                {
                    "url": [
                        7,
                        "String!"
                    ]
                }
            ],
            "fileUploadDangerouslyDelete": [
                533,
                {
                    "assetUrl": [
                        7,
                        "String!"
                    ]
                }
            ],
            "workflowStateCreate": [
                534,
                {
                    "input": [
                        535,
                        "WorkflowStateCreateInput!"
                    ]
                }
            ],
            "workflowStateUpdate": [
                534,
                {
                    "input": [
                        536,
                        "WorkflowStateUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "workflowStateArchive": [
                537,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "webhookCreate": [
                539,
                {
                    "input": [
                        540,
                        "WebhookCreateInput!"
                    ]
                }
            ],
            "webhookUpdate": [
                539,
                {
                    "input": [
                        541,
                        "WebhookUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "webhookDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "webhookRotateSecret": [
                543,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "viewPreferencesCreate": [
                544,
                {
                    "input": [
                        545,
                        "ViewPreferencesCreateInput!"
                    ]
                }
            ],
            "viewPreferencesUpdate": [
                544,
                {
                    "input": [
                        548,
                        "ViewPreferencesUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "viewPreferencesDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userSettingsUpdate": [
                549,
                {
                    "input": [
                        550,
                        "UserSettingsUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userSettingsFlagsReset": [
                557,
                {
                    "flags": [
                        558,
                        "[UserFlagType!]"
                    ]
                }
            ],
            "userFlagUpdate": [
                559,
                {
                    "operation": [
                        560,
                        "UserFlagUpdateOperation!"
                    ],
                    "flag": [
                        558,
                        "UserFlagType!"
                    ]
                }
            ],
            "notificationCategoryChannelSubscriptionUpdate": [
                549,
                {
                    "channel": [
                        561,
                        "NotificationChannel!"
                    ],
                    "category": [
                        375,
                        "NotificationCategory!"
                    ],
                    "subscribe": [
                        12,
                        "Boolean!"
                    ]
                }
            ],
            "userUpdate": [
                562,
                {
                    "input": [
                        563,
                        "UserUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userDiscordConnect": [
                562,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userExternalUserDisconnect": [
                562,
                {
                    "service": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userChangeRole": [
                564,
                {
                    "role": [
                        445,
                        "UserRoleType!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userSuspend": [
                564,
                {
                    "forceBypassScimRestrictions": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userRevokeAllSessions": [
                564,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userRevokeSession": [
                564,
                {
                    "sessionId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userUnsuspend": [
                564,
                {
                    "forceBypassScimRestrictions": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "userUnlinkFromIdentityProvider": [
                564,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "triageResponsibilityCreate": [
                565,
                {
                    "input": [
                        566,
                        "TriageResponsibilityCreateInput!"
                    ]
                }
            ],
            "triageResponsibilityUpdate": [
                565,
                {
                    "input": [
                        568,
                        "TriageResponsibilityUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "triageResponsibilityDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "timeScheduleCreate": [
                569,
                {
                    "input": [
                        570,
                        "TimeScheduleCreateInput!"
                    ]
                }
            ],
            "timeScheduleUpdate": [
                569,
                {
                    "input": [
                        572,
                        "TimeScheduleUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "timeScheduleUpsertExternal": [
                569,
                {
                    "input": [
                        572,
                        "TimeScheduleUpdateInput!"
                    ],
                    "externalId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "timeScheduleDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "timeScheduleRefreshIntegrationSchedule": [
                569,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "templateCreate": [
                573,
                {
                    "input": [
                        574,
                        "TemplateCreateInput!"
                    ]
                }
            ],
            "templateUpdate": [
                573,
                {
                    "input": [
                        575,
                        "TemplateUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "templateDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectCreate": [
                576,
                {
                    "slackChannelName": [
                        7
                    ],
                    "input": [
                        577,
                        "ProjectCreateInput!"
                    ]
                }
            ],
            "projectUpdate": [
                576,
                {
                    "input": [
                        578,
                        "ProjectUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectReassignStatus": [
                579,
                {
                    "newProjectStatusId": [
                        7,
                        "String!"
                    ],
                    "originalProjectStatusId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectDelete": [
                580,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectArchive": [
                580,
                {
                    "trash": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectUnarchive": [
                580,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectAddLabel": [
                576,
                {
                    "labelId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectRemoveLabel": [
                576,
                {
                    "labelId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectExternalSyncDisable": [
                576,
                {
                    "syncSource": [
                        205,
                        "ExternalSyncService!"
                    ],
                    "projectId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamCreate": [
                581,
                {
                    "copySettingsFromTeamId": [
                        7
                    ],
                    "input": [
                        582,
                        "TeamCreateInput!"
                    ]
                }
            ],
            "teamUpdate": [
                581,
                {
                    "mapping": [
                        584
                    ],
                    "input": [
                        585,
                        "TeamUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamUnarchive": [
                589,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamCyclesDelete": [
                581,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamMembershipCreate": [
                590,
                {
                    "input": [
                        591,
                        "TeamMembershipCreateInput!"
                    ]
                }
            ],
            "teamMembershipUpdate": [
                590,
                {
                    "input": [
                        592,
                        "TeamMembershipUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamMembershipDelete": [
                542,
                {
                    "alsoLeaveParentTeams": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "teamKeyDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "roadmapToProjectCreate": [
                593,
                {
                    "input": [
                        594,
                        "RoadmapToProjectCreateInput!"
                    ]
                }
            ],
            "roadmapToProjectUpdate": [
                593,
                {
                    "input": [
                        595,
                        "RoadmapToProjectUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "roadmapToProjectDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "roadmapCreate": [
                596,
                {
                    "input": [
                        597,
                        "RoadmapCreateInput!"
                    ]
                }
            ],
            "roadmapUpdate": [
                596,
                {
                    "input": [
                        598,
                        "RoadmapUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "roadmapArchive": [
                599,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "roadmapUnarchive": [
                599,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "roadmapDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "createCsvExportReport": [
                600,
                {
                    "includePrivateTeamIds": [
                        7,
                        "[String!]"
                    ]
                }
            ],
            "releaseStageCreate": [
                601,
                {
                    "input": [
                        602,
                        "ReleaseStageCreateInput!"
                    ]
                }
            ],
            "releaseStageUpdate": [
                601,
                {
                    "input": [
                        603,
                        "ReleaseStageUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseStageArchive": [
                604,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseStageUnarchive": [
                604,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseSync": [
                605,
                {
                    "input": [
                        606,
                        "ReleaseSyncInput!"
                    ]
                }
            ],
            "releaseCreate": [
                605,
                {
                    "input": [
                        611,
                        "ReleaseCreateInput!"
                    ]
                }
            ],
            "releaseUpdate": [
                605,
                {
                    "input": [
                        612,
                        "ReleaseUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseComplete": [
                605,
                {
                    "input": [
                        613,
                        "ReleaseCompleteInput!"
                    ]
                }
            ],
            "releaseUpdateByPipeline": [
                605,
                {
                    "input": [
                        614,
                        "ReleaseUpdateByPipelineInput!"
                    ]
                }
            ],
            "releaseDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseArchive": [
                615,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseUnarchive": [
                615,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releaseSyncByAccessKey": [
                605,
                {
                    "input": [
                        616,
                        "ReleaseSyncInputBase!"
                    ]
                }
            ],
            "releaseCompleteByAccessKey": [
                605,
                {
                    "input": [
                        617,
                        "ReleaseCompleteInputBase!"
                    ]
                }
            ],
            "releaseUpdateByPipelineByAccessKey": [
                605,
                {
                    "input": [
                        618,
                        "ReleaseUpdateByPipelineInputBase!"
                    ]
                }
            ],
            "releasePipelineCreate": [
                619,
                {
                    "input": [
                        620,
                        "ReleasePipelineCreateInput!"
                    ]
                }
            ],
            "releasePipelineUpdate": [
                619,
                {
                    "input": [
                        621,
                        "ReleasePipelineUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releasePipelineArchive": [
                622,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releasePipelineUnarchive": [
                622,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "releasePipelineDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "reactionCreate": [
                623,
                {
                    "input": [
                        624,
                        "ReactionCreateInput!"
                    ]
                }
            ],
            "reactionDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "pushSubscriptionCreate": [
                625,
                {
                    "input": [
                        627,
                        "PushSubscriptionCreateInput!"
                    ]
                }
            ],
            "pushSubscriptionDelete": [
                625,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectUpdateCreate": [
                629,
                {
                    "input": [
                        630,
                        "ProjectUpdateCreateInput!"
                    ]
                }
            ],
            "projectUpdateUpdate": [
                629,
                {
                    "input": [
                        631,
                        "ProjectUpdateUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectUpdateArchive": [
                632,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectUpdateUnarchive": [
                632,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectUpdateDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "createProjectUpdateReminder": [
                633,
                {
                    "userId": [
                        7
                    ],
                    "projectId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectStatusCreate": [
                634,
                {
                    "input": [
                        635,
                        "ProjectStatusCreateInput!"
                    ]
                }
            ],
            "projectStatusUpdate": [
                634,
                {
                    "input": [
                        636,
                        "ProjectStatusUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectStatusArchive": [
                637,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectStatusUnarchive": [
                637,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectRelationCreate": [
                638,
                {
                    "input": [
                        639,
                        "ProjectRelationCreateInput!"
                    ]
                }
            ],
            "projectRelationUpdate": [
                638,
                {
                    "input": [
                        640,
                        "ProjectRelationUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectRelationDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectMilestoneCreate": [
                641,
                {
                    "input": [
                        642,
                        "ProjectMilestoneCreateInput!"
                    ]
                }
            ],
            "projectMilestoneUpdate": [
                641,
                {
                    "input": [
                        643,
                        "ProjectMilestoneUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectMilestoneDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectMilestoneMove": [
                644,
                {
                    "input": [
                        647,
                        "ProjectMilestoneMoveInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectLabelCreate": [
                650,
                {
                    "input": [
                        651,
                        "ProjectLabelCreateInput!"
                    ]
                }
            ],
            "projectLabelUpdate": [
                650,
                {
                    "input": [
                        652,
                        "ProjectLabelUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectLabelDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectLabelRetire": [
                650,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "projectLabelRestore": [
                650,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationUpdate": [
                653,
                {
                    "input": [
                        654,
                        "OrganizationUpdateInput!"
                    ]
                }
            ],
            "organizationDeleteChallenge": [
                657
            ],
            "organizationDelete": [
                657,
                {
                    "input": [
                        658,
                        "DeleteOrganizationInput!"
                    ]
                }
            ],
            "organizationCancelDelete": [
                659
            ],
            "organizationStartTrialForPlan": [
                660,
                {
                    "input": [
                        661,
                        "OrganizationStartTrialInput!"
                    ]
                }
            ],
            "organizationStartTrial": [
                660
            ],
            "organizationInviteCreate": [
                662,
                {
                    "input": [
                        663,
                        "OrganizationInviteCreateInput!"
                    ]
                }
            ],
            "organizationInviteUpdate": [
                662,
                {
                    "input": [
                        664,
                        "OrganizationInviteUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "resendOrganizationInvite": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "resendOrganizationInviteByEmail": [
                542,
                {
                    "email": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationInviteDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationDomainClaim": [
                665,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationDomainVerify": [
                666,
                {
                    "input": [
                        669,
                        "OrganizationDomainVerificationInput!"
                    ]
                }
            ],
            "organizationDomainCreate": [
                666,
                {
                    "triggerEmailVerification": [
                        12
                    ],
                    "input": [
                        670,
                        "OrganizationDomainCreateInput!"
                    ]
                }
            ],
            "organizationDomainUpdate": [
                666,
                {
                    "input": [
                        671,
                        "OrganizationDomainUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "organizationDomainDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "notificationSubscriptionCreate": [
                672,
                {
                    "input": [
                        673,
                        "NotificationSubscriptionCreateInput!"
                    ]
                }
            ],
            "notificationSubscriptionUpdate": [
                672,
                {
                    "input": [
                        674,
                        "NotificationSubscriptionUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "notificationSubscriptionDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "notificationUpdate": [
                675,
                {
                    "input": [
                        676,
                        "NotificationUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "notificationMarkReadAll": [
                677,
                {
                    "readAt": [
                        5,
                        "DateTime!"
                    ],
                    "input": [
                        678,
                        "NotificationEntityInput!"
                    ]
                }
            ],
            "notificationMarkUnreadAll": [
                677,
                {
                    "input": [
                        678,
                        "NotificationEntityInput!"
                    ]
                }
            ],
            "notificationSnoozeAll": [
                677,
                {
                    "snoozedUntilAt": [
                        5,
                        "DateTime!"
                    ],
                    "input": [
                        678,
                        "NotificationEntityInput!"
                    ]
                }
            ],
            "notificationUnsnoozeAll": [
                677,
                {
                    "unsnoozedAt": [
                        5,
                        "DateTime!"
                    ],
                    "input": [
                        678,
                        "NotificationEntityInput!"
                    ]
                }
            ],
            "notificationArchive": [
                679,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "notificationArchiveAll": [
                677,
                {
                    "input": [
                        678,
                        "NotificationEntityInput!"
                    ]
                }
            ],
            "notificationUnarchive": [
                679,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueToReleaseCreate": [
                680,
                {
                    "input": [
                        681,
                        "IssueToReleaseCreateInput!"
                    ]
                }
            ],
            "issueToReleaseDeleteByIssueAndRelease": [
                542,
                {
                    "releaseId": [
                        7,
                        "String!"
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueToReleaseDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueCreate": [
                682,
                {
                    "input": [
                        683,
                        "IssueCreateInput!"
                    ]
                }
            ],
            "issueBatchCreate": [
                684,
                {
                    "input": [
                        685,
                        "IssueBatchCreateInput!"
                    ]
                }
            ],
            "issueUpdate": [
                682,
                {
                    "input": [
                        686,
                        "IssueUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueBatchUpdate": [
                684,
                {
                    "input": [
                        686,
                        "IssueUpdateInput!"
                    ],
                    "ids": [
                        687,
                        "[UUID!]!"
                    ]
                }
            ],
            "issueArchive": [
                688,
                {
                    "trash": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueUnarchive": [
                688,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueDelete": [
                688,
                {
                    "permanentlyDelete": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueAddLabel": [
                682,
                {
                    "labelId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueRemoveLabel": [
                682,
                {
                    "labelId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueReminder": [
                682,
                {
                    "reminderAt": [
                        5,
                        "DateTime!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueSubscribe": [
                682,
                {
                    "userEmail": [
                        7
                    ],
                    "userId": [
                        7
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueUnsubscribe": [
                682,
                {
                    "userEmail": [
                        7
                    ],
                    "userId": [
                        7
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueDescriptionUpdateFromFront": [
                682,
                {
                    "description": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueExternalSyncDisable": [
                682,
                {
                    "attachmentId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueRelationCreate": [
                689,
                {
                    "overrideCreatedAt": [
                        5
                    ],
                    "input": [
                        690,
                        "IssueRelationCreateInput!"
                    ]
                }
            ],
            "issueRelationUpdate": [
                689,
                {
                    "input": [
                        692,
                        "IssueRelationUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueRelationDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueLabelCreate": [
                693,
                {
                    "replaceTeamLabels": [
                        12
                    ],
                    "input": [
                        694,
                        "IssueLabelCreateInput!"
                    ]
                }
            ],
            "issueLabelUpdate": [
                693,
                {
                    "replaceTeamLabels": [
                        12
                    ],
                    "input": [
                        695,
                        "IssueLabelUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueLabelDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueLabelRetire": [
                693,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueLabelRestore": [
                693,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueImportCreateGithub": [
                696,
                {
                    "teamId": [
                        7
                    ],
                    "teamName": [
                        7
                    ],
                    "githubRepoIds": [
                        105,
                        "[Int!]"
                    ],
                    "githubLabels": [
                        7,
                        "[String!]"
                    ],
                    "instantProcess": [
                        12
                    ],
                    "includeClosedIssues": [
                        12
                    ]
                }
            ],
            "issueImportCreateJira": [
                696,
                {
                    "teamId": [
                        7
                    ],
                    "teamName": [
                        7
                    ],
                    "jiraToken": [
                        7,
                        "String!"
                    ],
                    "jiraProject": [
                        7,
                        "String!"
                    ],
                    "jiraEmail": [
                        7,
                        "String!"
                    ],
                    "jiraHostname": [
                        7,
                        "String!"
                    ],
                    "jql": [
                        7
                    ],
                    "instantProcess": [
                        12
                    ],
                    "includeClosedIssues": [
                        12
                    ],
                    "id": [
                        7
                    ]
                }
            ],
            "issueImportCreateCSVJira": [
                696,
                {
                    "teamId": [
                        7
                    ],
                    "teamName": [
                        7
                    ],
                    "csvUrl": [
                        7,
                        "String!"
                    ],
                    "jiraHostname": [
                        7
                    ],
                    "jiraToken": [
                        7
                    ],
                    "jiraEmail": [
                        7
                    ]
                }
            ],
            "issueImportCreateClubhouse": [
                696,
                {
                    "teamId": [
                        7
                    ],
                    "teamName": [
                        7
                    ],
                    "clubhouseToken": [
                        7,
                        "String!"
                    ],
                    "clubhouseGroupName": [
                        7,
                        "String!"
                    ],
                    "instantProcess": [
                        12
                    ],
                    "includeClosedIssues": [
                        12
                    ],
                    "id": [
                        7
                    ]
                }
            ],
            "issueImportCreateAsana": [
                696,
                {
                    "teamId": [
                        7
                    ],
                    "teamName": [
                        7
                    ],
                    "asanaToken": [
                        7,
                        "String!"
                    ],
                    "asanaTeamName": [
                        7,
                        "String!"
                    ],
                    "instantProcess": [
                        12
                    ],
                    "includeClosedIssues": [
                        12
                    ],
                    "id": [
                        7
                    ]
                }
            ],
            "issueImportCreateLinearV2": [
                696,
                {
                    "linearSourceOrganizationId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ]
                }
            ],
            "issueImportDelete": [
                697,
                {
                    "issueImportId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueImportProcess": [
                696,
                {
                    "mapping": [
                        18,
                        "JSONObject!"
                    ],
                    "issueImportId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "issueImportUpdate": [
                696,
                {
                    "input": [
                        698,
                        "IssueImportUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationsSettingsCreate": [
                699,
                {
                    "input": [
                        700,
                        "IntegrationsSettingsCreateInput!"
                    ]
                }
            ],
            "integrationsSettingsUpdate": [
                699,
                {
                    "input": [
                        701,
                        "IntegrationsSettingsUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationTemplateCreate": [
                702,
                {
                    "input": [
                        703,
                        "IntegrationTemplateCreateInput!"
                    ]
                }
            ],
            "integrationTemplateDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationUpdate": [
                704,
                {
                    "input": [
                        705,
                        "IntegrationUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSettingsUpdate": [
                704,
                {
                    "input": [
                        706,
                        "IntegrationSettingsInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGithubCommitCreate": [
                740
            ],
            "integrationGithubConnect": [
                704,
                {
                    "githubHost": [
                        7
                    ],
                    "codeAccess": [
                        12
                    ],
                    "code": [
                        7,
                        "String!"
                    ],
                    "installationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGithubImportConnect": [
                704,
                {
                    "code": [
                        7,
                        "String!"
                    ],
                    "installationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGithubImportRefresh": [
                704,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGitHubEnterpriseServerConnect": [
                741,
                {
                    "organizationName": [
                        7,
                        "String!"
                    ],
                    "githubUrl": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGitlabConnect": [
                742,
                {
                    "gitlabUrl": [
                        7,
                        "String!"
                    ],
                    "accessToken": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGitlabTestConnection": [
                743,
                {
                    "integrationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "airbyteIntegrationConnect": [
                704,
                {
                    "input": [
                        744,
                        "AirbyteConfigurationInput!"
                    ]
                }
            ],
            "integrationGoogleCalendarPersonalConnect": [
                704,
                {
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationLaunchDarklyConnect": [
                704,
                {
                    "code": [
                        7,
                        "String!"
                    ],
                    "projectKey": [
                        7,
                        "String!"
                    ],
                    "environment": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationLaunchDarklyPersonalConnect": [
                704,
                {
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "jiraIntegrationConnect": [
                704,
                {
                    "input": [
                        745,
                        "JiraConfigurationInput!"
                    ]
                }
            ],
            "integrationJiraUpdate": [
                704,
                {
                    "input": [
                        746,
                        "JiraUpdateInput!"
                    ]
                }
            ],
            "integrationJiraFetchProjectStatuses": [
                747,
                {
                    "input": [
                        748,
                        "JiraFetchProjectStatusesInput!"
                    ]
                }
            ],
            "integrationJiraPersonal": [
                704,
                {
                    "code": [
                        7
                    ],
                    "accessToken": [
                        7
                    ]
                }
            ],
            "integrationGitHubPersonal": [
                704,
                {
                    "codeAccess": [
                        12
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationIntercom": [
                704,
                {
                    "domainUrl": [
                        7
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationIntercomDelete": [
                704
            ],
            "integrationCustomerDataAttributesRefresh": [
                704,
                {
                    "input": [
                        749,
                        "IntegrationCustomerDataAttributesRefreshInput!"
                    ]
                }
            ],
            "integrationIntercomSettingsUpdate": [
                704,
                {
                    "input": [
                        726,
                        "IntercomSettingsInput!"
                    ]
                }
            ],
            "integrationDiscord": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationOpsgenieConnect": [
                704,
                {
                    "apiKey": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationOpsgenieRefreshScheduleMappings": [
                704
            ],
            "integrationPagerDutyConnect": [
                704,
                {
                    "code": [
                        7,
                        "String!"
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationPagerDutyRefreshScheduleMappings": [
                704
            ],
            "updateIntegrationSlackScopes": [
                704,
                {
                    "integrationId": [
                        7,
                        "String!"
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlack": [
                704,
                {
                    "shouldUseV2Auth": [
                        12
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackAsks": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackOrAsksUpdateSlackTeamName": [
                750,
                {
                    "integrationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackPersonal": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationAsksConnectChannel": [
                751,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackPost": [
                754,
                {
                    "shouldUseV2Auth": [
                        12
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "teamId": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackProjectPost": [
                754,
                {
                    "service": [
                        7,
                        "String!"
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "projectId": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackInitiativePost": [
                754,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "initiativeId": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackCustomViewNotifications": [
                754,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "customViewId": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackCustomerChannelLink": [
                579,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "customerId": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackOrgProjectUpdatesPost": [
                754,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackOrgInitiativeUpdatesPost": [
                754,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackImportEmojis": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationFigma": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGong": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationMicrosoftTeams": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationMicrosoftPersonalConnect": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationGoogleSheets": [
                704,
                {
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "refreshGoogleSheetsData": [
                704,
                {
                    "type": [
                        7
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSentryConnect": [
                704,
                {
                    "organizationSlug": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ],
                    "installationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationFront": [
                704,
                {
                    "redirectUri": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationZendesk": [
                704,
                {
                    "subdomain": [
                        7,
                        "String!"
                    ],
                    "code": [
                        7,
                        "String!"
                    ],
                    "scope": [
                        7,
                        "String!"
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationLoom": [
                704
            ],
            "integrationSalesforce": [
                704,
                {
                    "code": [
                        7,
                        "String!"
                    ],
                    "subdomain": [
                        7,
                        "String!"
                    ],
                    "redirectUri": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSalesforceMetadataRefresh": [
                704,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationMcpServerPersonalConnect": [
                704,
                {
                    "serverUrl": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationMcpServerConnect": [
                704,
                {
                    "teamId": [
                        7
                    ],
                    "serverUrl": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationDelete": [
                542,
                {
                    "skipInstallationDeletion": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationArchive": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationSlackWorkflowAccessUpdate": [
                704,
                {
                    "enabled": [
                        12,
                        "Boolean!"
                    ],
                    "integrationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "integrationRequest": [
                755,
                {
                    "input": [
                        756,
                        "IntegrationRequestInput!"
                    ]
                }
            ],
            "initiativeUpdateCreate": [
                757,
                {
                    "input": [
                        758,
                        "InitiativeUpdateCreateInput!"
                    ]
                }
            ],
            "initiativeUpdateUpdate": [
                757,
                {
                    "input": [
                        759,
                        "InitiativeUpdateUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeUpdateArchive": [
                760,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "createInitiativeUpdateReminder": [
                761,
                {
                    "userId": [
                        7
                    ],
                    "initiativeId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeUpdateUnarchive": [
                760,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeToProjectCreate": [
                762,
                {
                    "input": [
                        763,
                        "InitiativeToProjectCreateInput!"
                    ]
                }
            ],
            "initiativeToProjectUpdate": [
                762,
                {
                    "input": [
                        764,
                        "InitiativeToProjectUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeToProjectDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeCreate": [
                765,
                {
                    "input": [
                        766,
                        "InitiativeCreateInput!"
                    ]
                }
            ],
            "initiativeUpdate": [
                765,
                {
                    "input": [
                        767,
                        "InitiativeUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeArchive": [
                768,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeUnarchive": [
                768,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeRelationCreate": [
                769,
                {
                    "input": [
                        770,
                        "InitiativeRelationCreateInput!"
                    ]
                }
            ],
            "initiativeRelationUpdate": [
                542,
                {
                    "input": [
                        771,
                        "InitiativeRelationUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "initiativeRelationDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "gitAutomationTargetBranchCreate": [
                772,
                {
                    "input": [
                        773,
                        "GitAutomationTargetBranchCreateInput!"
                    ]
                }
            ],
            "gitAutomationTargetBranchUpdate": [
                772,
                {
                    "input": [
                        774,
                        "GitAutomationTargetBranchUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "gitAutomationTargetBranchDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "gitAutomationStateCreate": [
                775,
                {
                    "input": [
                        776,
                        "GitAutomationStateCreateInput!"
                    ]
                }
            ],
            "gitAutomationStateUpdate": [
                775,
                {
                    "input": [
                        777,
                        "GitAutomationStateUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "gitAutomationStateDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "favoriteCreate": [
                778,
                {
                    "input": [
                        779,
                        "FavoriteCreateInput!"
                    ]
                }
            ],
            "favoriteUpdate": [
                778,
                {
                    "input": [
                        780,
                        "FavoriteUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "favoriteDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "trackAnonymousEvent": [
                781,
                {
                    "input": [
                        782,
                        "EventTrackingInput!"
                    ]
                }
            ],
            "entityExternalLinkCreate": [
                783,
                {
                    "input": [
                        784,
                        "EntityExternalLinkCreateInput!"
                    ]
                }
            ],
            "entityExternalLinkUpdate": [
                783,
                {
                    "input": [
                        785,
                        "EntityExternalLinkUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "entityExternalLinkDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "emojiCreate": [
                786,
                {
                    "input": [
                        787,
                        "EmojiCreateInput!"
                    ]
                }
            ],
            "emojiDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "emailUnsubscribe": [
                788,
                {
                    "input": [
                        789,
                        "EmailUnsubscribeInput!"
                    ]
                }
            ],
            "emailIntakeAddressCreate": [
                790,
                {
                    "input": [
                        791,
                        "EmailIntakeAddressCreateInput!"
                    ]
                }
            ],
            "emailIntakeAddressRotate": [
                790,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "emailIntakeAddressUpdate": [
                790,
                {
                    "input": [
                        792,
                        "EmailIntakeAddressUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "emailIntakeAddressDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "documentCreate": [
                793,
                {
                    "input": [
                        794,
                        "DocumentCreateInput!"
                    ]
                }
            ],
            "documentUpdate": [
                793,
                {
                    "input": [
                        795,
                        "DocumentUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "documentDelete": [
                796,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "documentUnarchive": [
                796,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "cycleCreate": [
                797,
                {
                    "input": [
                        798,
                        "CycleCreateInput!"
                    ]
                }
            ],
            "cycleUpdate": [
                797,
                {
                    "input": [
                        799,
                        "CycleUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "cycleArchive": [
                800,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "cycleShiftAll": [
                797,
                {
                    "input": [
                        801,
                        "CycleShiftAllInput!"
                    ]
                }
            ],
            "cycleStartUpcomingCycleToday": [
                797,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerTierCreate": [
                802,
                {
                    "input": [
                        803,
                        "CustomerTierCreateInput!"
                    ]
                }
            ],
            "customerTierUpdate": [
                802,
                {
                    "input": [
                        804,
                        "CustomerTierUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerTierDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerStatusCreate": [
                805,
                {
                    "input": [
                        806,
                        "CustomerStatusCreateInput!"
                    ]
                }
            ],
            "customerStatusUpdate": [
                805,
                {
                    "input": [
                        807,
                        "CustomerStatusUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerStatusDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerCreate": [
                808,
                {
                    "input": [
                        809,
                        "CustomerCreateInput!"
                    ]
                }
            ],
            "customerUpdate": [
                808,
                {
                    "input": [
                        810,
                        "CustomerUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerMerge": [
                808,
                {
                    "sourceCustomerId": [
                        7,
                        "String!"
                    ],
                    "targetCustomerId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerUpsert": [
                808,
                {
                    "input": [
                        811,
                        "CustomerUpsertInput!"
                    ]
                }
            ],
            "customerUnsync": [
                808,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerNeedCreate": [
                812,
                {
                    "input": [
                        813,
                        "CustomerNeedCreateInput!"
                    ]
                }
            ],
            "customerNeedCreateFromAttachment": [
                812,
                {
                    "input": [
                        814,
                        "CustomerNeedCreateFromAttachmentInput!"
                    ]
                }
            ],
            "customerNeedUpdate": [
                815,
                {
                    "input": [
                        816,
                        "CustomerNeedUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerNeedDelete": [
                542,
                {
                    "keepAttachment": [
                        12
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerNeedArchive": [
                817,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customerNeedUnarchive": [
                817,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customViewCreate": [
                818,
                {
                    "input": [
                        819,
                        "CustomViewCreateInput!"
                    ]
                }
            ],
            "customViewUpdate": [
                818,
                {
                    "input": [
                        820,
                        "CustomViewUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "customViewDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "contactCreate": [
                821,
                {
                    "input": [
                        822,
                        "ContactCreateInput!"
                    ]
                }
            ],
            "contactSalesCreate": [
                821,
                {
                    "input": [
                        823,
                        "ContactSalesCreateInput!"
                    ]
                }
            ],
            "commentCreate": [
                824,
                {
                    "input": [
                        825,
                        "CommentCreateInput!"
                    ]
                }
            ],
            "commentUpdate": [
                824,
                {
                    "skipEditedAt": [
                        12
                    ],
                    "input": [
                        826,
                        "CommentUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "commentDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "commentResolve": [
                824,
                {
                    "resolvingCommentId": [
                        7
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "commentUnresolve": [
                824,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "emailUserAccountAuthChallenge": [
                827,
                {
                    "input": [
                        828,
                        "EmailUserAccountAuthChallengeInput!"
                    ]
                }
            ],
            "emailTokenUserAccountAuth": [
                515,
                {
                    "input": [
                        829,
                        "TokenUserAccountAuthInput!"
                    ]
                }
            ],
            "samlTokenUserAccountAuth": [
                515,
                {
                    "input": [
                        829,
                        "TokenUserAccountAuthInput!"
                    ]
                }
            ],
            "googleUserAccountAuth": [
                515,
                {
                    "input": [
                        830,
                        "GoogleUserAccountAuthInput!"
                    ]
                }
            ],
            "passkeyLoginStart": [
                831,
                {
                    "authId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "passkeyLoginFinish": [
                515,
                {
                    "response": [
                        18,
                        "JSONObject!"
                    ],
                    "authId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "createOrganizationFromOnboarding": [
                832,
                {
                    "sessionId": [
                        7
                    ],
                    "survey": [
                        833
                    ],
                    "input": [
                        834,
                        "CreateOrganizationInput!"
                    ]
                }
            ],
            "joinOrganizationFromOnboarding": [
                832,
                {
                    "input": [
                        835,
                        "JoinOrganizationInput!"
                    ]
                }
            ],
            "leaveOrganization": [
                832,
                {
                    "organizationId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "logout": [
                836,
                {
                    "reason": [
                        7
                    ]
                }
            ],
            "logoutSession": [
                836,
                {
                    "sessionId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "logoutAllSessions": [
                836,
                {
                    "reason": [
                        7
                    ]
                }
            ],
            "logoutOtherSessions": [
                836,
                {
                    "reason": [
                        7
                    ]
                }
            ],
            "attachmentCreate": [
                837,
                {
                    "input": [
                        838,
                        "AttachmentCreateInput!"
                    ]
                }
            ],
            "attachmentUpdate": [
                837,
                {
                    "input": [
                        839,
                        "AttachmentUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentLinkURL": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "url": [
                        7,
                        "String!"
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ]
                }
            ],
            "attachmentLinkGitLabMR": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "url": [
                        7,
                        "String!"
                    ],
                    "projectPathWithNamespace": [
                        7,
                        "String!"
                    ],
                    "number": [
                        9,
                        "Float!"
                    ]
                }
            ],
            "attachmentLinkGitHubIssue": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "url": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentLinkGitHubPR": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "url": [
                        7,
                        "String!"
                    ],
                    "linkKind": [
                        840
                    ]
                }
            ],
            "attachmentLinkZendesk": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "ticketId": [
                        7,
                        "String!"
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "url": [
                        7
                    ]
                }
            ],
            "attachmentLinkDiscord": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "channelId": [
                        7,
                        "String!"
                    ],
                    "messageId": [
                        7,
                        "String!"
                    ],
                    "url": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentSyncToSlack": [
                837,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentLinkSlack": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "url": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "syncToCommentThread": [
                        12
                    ]
                }
            ],
            "attachmentLinkFront": [
                841,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "conversationId": [
                        7,
                        "String!"
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ]
                }
            ],
            "attachmentLinkIntercom": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "conversationId": [
                        7,
                        "String!"
                    ],
                    "partId": [
                        7
                    ],
                    "id": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentLinkJiraIssue": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "jiraIssueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "url": [
                        7
                    ]
                }
            ],
            "attachmentLinkSalesforce": [
                837,
                {
                    "createAsUser": [
                        7
                    ],
                    "displayIconUrl": [
                        7
                    ],
                    "title": [
                        7
                    ],
                    "issueId": [
                        7,
                        "String!"
                    ],
                    "id": [
                        7
                    ],
                    "url": [
                        7,
                        "String!"
                    ]
                }
            ],
            "attachmentDelete": [
                542,
                {
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "agentSessionCreateOnComment": [
                842,
                {
                    "input": [
                        843,
                        "AgentSessionCreateOnComment!"
                    ]
                }
            ],
            "agentSessionCreateOnIssue": [
                842,
                {
                    "input": [
                        845,
                        "AgentSessionCreateOnIssue!"
                    ]
                }
            ],
            "agentSessionCreate": [
                842,
                {
                    "pullRequestId": [
                        7
                    ],
                    "input": [
                        846,
                        "AgentSessionCreateInput!"
                    ]
                }
            ],
            "agentSessionUpdateExternalUrl": [
                842,
                {
                    "input": [
                        847,
                        "AgentSessionUpdateExternalUrlInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "agentSessionUpdate": [
                842,
                {
                    "input": [
                        848,
                        "AgentSessionUpdateInput!"
                    ],
                    "id": [
                        7,
                        "String!"
                    ]
                }
            ],
            "agentActivityCreate": [
                850,
                {
                    "input": [
                        851,
                        "AgentActivityCreateInput!"
                    ]
                }
            ],
            "agentActivityCreatePrompt": [
                850,
                {
                    "input": [
                        852,
                        "AgentActivityCreatePromptInput!"
                    ]
                }
            ],
            "__typename": [
                7
            ]
        },
        "UploadPayload": {
            "lastSyncId": [
                9
            ],
            "uploadFile": [
                530
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "UploadFile": {
            "filename": [
                7
            ],
            "contentType": [
                7
            ],
            "size": [
                105
            ],
            "uploadUrl": [
                7
            ],
            "assetUrl": [
                7
            ],
            "metaData": [
                18
            ],
            "headers": [
                531
            ],
            "__typename": [
                7
            ]
        },
        "UploadFileHeader": {
            "key": [
                7
            ],
            "value": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ImageUploadFromUrlPayload": {
            "lastSyncId": [
                9
            ],
            "url": [
                7
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "FileUploadDeletePayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStatePayload": {
            "lastSyncId": [
                9
            ],
            "workflowState": [
                13
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStateCreateInput": {
            "id": [
                7
            ],
            "type": [
                7
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "teamId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStateUpdateInput": {
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "WorkflowStateArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                13
            ],
            "__typename": [
                7
            ]
        },
        "ArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "on_WorkflowStateArchivePayload": [
                537
            ],
            "on_DeletePayload": [
                542
            ],
            "on_ProjectArchivePayload": [
                580
            ],
            "on_TeamArchivePayload": [
                589
            ],
            "on_RoadmapArchivePayload": [
                599
            ],
            "on_ReleaseStageArchivePayload": [
                604
            ],
            "on_ReleaseArchivePayload": [
                615
            ],
            "on_ReleasePipelineArchivePayload": [
                622
            ],
            "on_ProjectUpdateArchivePayload": [
                632
            ],
            "on_ProjectStatusArchivePayload": [
                637
            ],
            "on_NotificationArchivePayload": [
                679
            ],
            "on_IssueArchivePayload": [
                688
            ],
            "on_InitiativeUpdateArchivePayload": [
                760
            ],
            "on_InitiativeArchivePayload": [
                768
            ],
            "on_DocumentArchivePayload": [
                796
            ],
            "on_CycleArchivePayload": [
                800
            ],
            "on_CustomerNeedArchivePayload": [
                817
            ],
            "__typename": [
                7
            ]
        },
        "WebhookPayload": {
            "lastSyncId": [
                9
            ],
            "webhook": [
                346
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "WebhookCreateInput": {
            "label": [
                7
            ],
            "id": [
                7
            ],
            "enabled": [
                12
            ],
            "secret": [
                7
            ],
            "url": [
                7
            ],
            "resourceTypes": [
                7
            ],
            "teamId": [
                7
            ],
            "allPublicTeams": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "WebhookUpdateInput": {
            "label": [
                7
            ],
            "secret": [
                7
            ],
            "enabled": [
                12
            ],
            "url": [
                7
            ],
            "resourceTypes": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "DeletePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entityId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "WebhookRotateSecretPayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "secret": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ViewPreferencesPayload": {
            "lastSyncId": [
                9
            ],
            "viewPreferences": [
                247
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ViewPreferencesCreateInput": {
            "id": [
                7
            ],
            "type": [
                546
            ],
            "viewType": [
                547
            ],
            "preferences": [
                18
            ],
            "insights": [
                18
            ],
            "teamId": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "labelId": [
                7
            ],
            "projectLabelId": [
                7
            ],
            "customViewId": [
                7
            ],
            "userId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ViewPreferencesType": {},
        "ViewType": {},
        "ViewPreferencesUpdateInput": {
            "preferences": [
                18
            ],
            "insights": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "UserSettingsPayload": {
            "lastSyncId": [
                9
            ],
            "userSettings": [
                388
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "UserSettingsUpdateInput": {
            "settings": [
                18
            ],
            "subscribedToChangelog": [
                12
            ],
            "subscribedToDPA": [
                12
            ],
            "subscribedToInviteAccepted": [
                12
            ],
            "subscribedToPrivacyLegalUpdates": [
                12
            ],
            "subscribedToGeneralMarketingCommunications": [
                12
            ],
            "notificationCategoryPreferences": [
                551
            ],
            "notificationChannelPreferences": [
                552
            ],
            "notificationDeliveryPreferences": [
                553
            ],
            "usageWarningHistory": [
                18
            ],
            "feedSummarySchedule": [
                178
            ],
            "feedLastSeenTime": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "NotificationCategoryPreferencesInput": {
            "assignments": [
                552
            ],
            "statusChanges": [
                552
            ],
            "commentsAndReplies": [
                552
            ],
            "mentions": [
                552
            ],
            "reactions": [
                552
            ],
            "subscriptions": [
                552
            ],
            "documentChanges": [
                552
            ],
            "postsAndUpdates": [
                552
            ],
            "reminders": [
                552
            ],
            "reviews": [
                552
            ],
            "appsAndIntegrations": [
                552
            ],
            "triage": [
                552
            ],
            "customers": [
                552
            ],
            "feed": [
                552
            ],
            "__typename": [
                7
            ]
        },
        "PartialNotificationChannelPreferencesInput": {
            "mobile": [
                12
            ],
            "desktop": [
                12
            ],
            "email": [
                12
            ],
            "slack": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferencesInput": {
            "mobile": [
                554
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferencesChannelInput": {
            "schedule": [
                555
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferencesScheduleInput": {
            "disabled": [
                12
            ],
            "sunday": [
                556
            ],
            "monday": [
                556
            ],
            "tuesday": [
                556
            ],
            "wednesday": [
                556
            ],
            "thursday": [
                556
            ],
            "friday": [
                556
            ],
            "saturday": [
                556
            ],
            "__typename": [
                7
            ]
        },
        "NotificationDeliveryPreferencesDayInput": {
            "start": [
                7
            ],
            "end": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "UserSettingsFlagsResetPayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "UserFlagType": {},
        "UserSettingsFlagPayload": {
            "lastSyncId": [
                9
            ],
            "flag": [
                7
            ],
            "value": [
                105
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "UserFlagUpdateOperation": {},
        "NotificationChannel": {},
        "UserPayload": {
            "lastSyncId": [
                9
            ],
            "user": [
                6
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "UserUpdateInput": {
            "name": [
                7
            ],
            "displayName": [
                7
            ],
            "avatarUrl": [
                7
            ],
            "description": [
                7
            ],
            "statusEmoji": [
                7
            ],
            "statusLabel": [
                7
            ],
            "statusUntilAt": [
                5
            ],
            "timezone": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "UserAdminPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "TriageResponsibilityPayload": {
            "lastSyncId": [
                9
            ],
            "triageResponsibility": [
                327
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "TriageResponsibilityCreateInput": {
            "id": [
                7
            ],
            "teamId": [
                7
            ],
            "action": [
                7
            ],
            "manualSelection": [
                567
            ],
            "timeScheduleId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TriageResponsibilityManualSelectionInput": {
            "userIds": [
                7
            ],
            "assignmentIndex": [
                105
            ],
            "__typename": [
                7
            ]
        },
        "TriageResponsibilityUpdateInput": {
            "action": [
                7
            ],
            "manualSelection": [
                567
            ],
            "timeScheduleId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TimeSchedulePayload": {
            "lastSyncId": [
                9
            ],
            "timeSchedule": [
                330
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "TimeScheduleCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "entries": [
                571
            ],
            "externalId": [
                7
            ],
            "externalUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TimeScheduleEntryInput": {
            "startsAt": [
                5
            ],
            "endsAt": [
                5
            ],
            "userId": [
                7
            ],
            "userEmail": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TimeScheduleUpdateInput": {
            "name": [
                7
            ],
            "entries": [
                571
            ],
            "externalId": [
                7
            ],
            "externalUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TemplatePayload": {
            "lastSyncId": [
                9
            ],
            "template": [
                116
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "TemplateCreateInput": {
            "id": [
                7
            ],
            "type": [
                7
            ],
            "teamId": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "templateData": [
                117
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "TemplateUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "teamId": [
                7
            ],
            "templateData": [
                117
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "ProjectPayload": {
            "lastSyncId": [
                9
            ],
            "project": [
                110
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "statusId": [
                7
            ],
            "description": [
                7
            ],
            "content": [
                7
            ],
            "teamIds": [
                7
            ],
            "convertedFromIssueId": [
                7
            ],
            "lastAppliedTemplateId": [
                7
            ],
            "templateId": [
                7
            ],
            "useDefaultTemplate": [
                12
            ],
            "leadId": [
                7
            ],
            "memberIds": [
                7
            ],
            "startDate": [
                17
            ],
            "startDateResolution": [
                115
            ],
            "targetDate": [
                17
            ],
            "targetDateResolution": [
                115
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "priority": [
                105
            ],
            "labelIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateInput": {
            "statusId": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "content": [
                7
            ],
            "convertedFromIssueId": [
                7
            ],
            "lastAppliedTemplateId": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "teamIds": [
                7
            ],
            "projectUpdateRemindersPausedUntilAt": [
                5
            ],
            "updateReminderFrequencyInWeeks": [
                9
            ],
            "updateReminderFrequency": [
                9
            ],
            "frequencyResolution": [
                111
            ],
            "updateRemindersDay": [
                112
            ],
            "updateRemindersHour": [
                105
            ],
            "leadId": [
                7
            ],
            "memberIds": [
                7
            ],
            "startDate": [
                17
            ],
            "startDateResolution": [
                115
            ],
            "targetDate": [
                17
            ],
            "targetDateResolution": [
                115
            ],
            "completedAt": [
                5
            ],
            "canceledAt": [
                5
            ],
            "slackNewIssue": [
                12
            ],
            "slackIssueComments": [
                12
            ],
            "slackIssueStatuses": [
                12
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "trashed": [
                12
            ],
            "priority": [
                105
            ],
            "labelIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "SuccessPayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                110
            ],
            "__typename": [
                7
            ]
        },
        "TeamPayload": {
            "lastSyncId": [
                9
            ],
            "team": [
                11
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "TeamCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "key": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "cyclesEnabled": [
                12
            ],
            "cycleStartDay": [
                9
            ],
            "cycleDuration": [
                105
            ],
            "cycleCooldownTime": [
                105
            ],
            "cycleIssueAutoAssignStarted": [
                12
            ],
            "cycleIssueAutoAssignCompleted": [
                12
            ],
            "cycleLockToActive": [
                12
            ],
            "upcomingCycleCount": [
                9
            ],
            "triageEnabled": [
                12
            ],
            "requirePriorityToLeaveTriage": [
                12
            ],
            "timezone": [
                7
            ],
            "inheritIssueEstimation": [
                12
            ],
            "inheritWorkflowStatuses": [
                12
            ],
            "issueEstimationType": [
                7
            ],
            "issueEstimationAllowZero": [
                12
            ],
            "setIssueSortOrderOnStateChange": [
                7
            ],
            "issueEstimationExtended": [
                12
            ],
            "defaultIssueEstimate": [
                9
            ],
            "groupIssueHistory": [
                12
            ],
            "defaultTemplateForMembersId": [
                7
            ],
            "defaultTemplateForNonMembersId": [
                7
            ],
            "defaultProjectTemplateId": [
                7
            ],
            "private": [
                12
            ],
            "autoClosePeriod": [
                9
            ],
            "autoCloseStateId": [
                7
            ],
            "autoArchivePeriod": [
                9
            ],
            "markedAsDuplicateWorkflowStateId": [
                7
            ],
            "parentId": [
                7
            ],
            "inheritProductIntelligenceScope": [
                12
            ],
            "productIntelligenceScope": [
                583
            ],
            "__typename": [
                7
            ]
        },
        "ProductIntelligenceScope": {},
        "InheritanceEntityMapping": {
            "workflowStates": [
                18
            ],
            "issueLabels": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "TeamUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "key": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "cyclesEnabled": [
                12
            ],
            "cycleStartDay": [
                9
            ],
            "cycleDuration": [
                105
            ],
            "cycleCooldownTime": [
                105
            ],
            "cycleIssueAutoAssignStarted": [
                12
            ],
            "cycleIssueAutoAssignCompleted": [
                12
            ],
            "cycleLockToActive": [
                12
            ],
            "cycleEnabledStartDate": [
                5
            ],
            "upcomingCycleCount": [
                9
            ],
            "timezone": [
                7
            ],
            "inheritIssueEstimation": [
                12
            ],
            "issueEstimationType": [
                7
            ],
            "issueEstimationAllowZero": [
                12
            ],
            "setIssueSortOrderOnStateChange": [
                7
            ],
            "issueEstimationExtended": [
                12
            ],
            "defaultIssueEstimate": [
                9
            ],
            "slackNewIssue": [
                12
            ],
            "slackIssueComments": [
                12
            ],
            "slackIssueStatuses": [
                12
            ],
            "groupIssueHistory": [
                12
            ],
            "aiThreadSummariesEnabled": [
                12
            ],
            "aiDiscussionSummariesEnabled": [
                12
            ],
            "defaultTemplateForMembersId": [
                7
            ],
            "defaultTemplateForNonMembersId": [
                7
            ],
            "defaultProjectTemplateId": [
                7
            ],
            "private": [
                12
            ],
            "triageEnabled": [
                12
            ],
            "requirePriorityToLeaveTriage": [
                12
            ],
            "defaultIssueStateId": [
                7
            ],
            "autoClosePeriod": [
                9
            ],
            "autoCloseStateId": [
                7
            ],
            "autoCloseParentIssues": [
                12
            ],
            "autoCloseChildIssues": [
                12
            ],
            "autoArchivePeriod": [
                9
            ],
            "markedAsDuplicateWorkflowStateId": [
                7
            ],
            "joinByDefault": [
                12
            ],
            "scimManaged": [
                12
            ],
            "parentId": [
                7
            ],
            "inheritWorkflowStatuses": [
                12
            ],
            "inheritProductIntelligenceScope": [
                12
            ],
            "productIntelligenceScope": [
                583
            ],
            "securitySettings": [
                586
            ],
            "allMembersCanJoin": [
                12
            ],
            "retiredAt": [
                5
            ],
            "handleSubTeamsOnRetirement": [
                588
            ],
            "__typename": [
                7
            ]
        },
        "TeamSecuritySettingsInput": {
            "labelManagement": [
                587
            ],
            "memberManagement": [
                587
            ],
            "teamManagement": [
                587
            ],
            "templateManagement": [
                587
            ],
            "__typename": [
                7
            ]
        },
        "TeamRoleType": {},
        "TeamRetirementSubTeamHandling": {},
        "TeamArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                11
            ],
            "__typename": [
                7
            ]
        },
        "TeamMembershipPayload": {
            "lastSyncId": [
                9
            ],
            "teamMembership": [
                332
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "TeamMembershipCreateInput": {
            "id": [
                7
            ],
            "userId": [
                7
            ],
            "teamId": [
                7
            ],
            "owner": [
                12
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "TeamMembershipUpdateInput": {
            "owner": [
                12
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapToProjectPayload": {
            "lastSyncId": [
                9
            ],
            "roadmapToProject": [
                427
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapToProjectCreateInput": {
            "id": [
                7
            ],
            "projectId": [
                7
            ],
            "roadmapId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapToProjectUpdateInput": {
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapPayload": {
            "lastSyncId": [
                9
            ],
            "roadmap": [
                428
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "ownerId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "color": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "ownerId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "color": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "RoadmapArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                428
            ],
            "__typename": [
                7
            ]
        },
        "CreateCsvExportReportPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStagePayload": {
            "lastSyncId": [
                9
            ],
            "releaseStage": [
                270
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStageCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "type": [
                101
            ],
            "position": [
                9
            ],
            "pipelineId": [
                7
            ],
            "frozen": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStageUpdateInput": {
            "name": [
                7
            ],
            "color": [
                7
            ],
            "position": [
                9
            ],
            "frozen": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseStageArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                270
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePayload": {
            "lastSyncId": [
                9
            ],
            "release": [
                265
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseSyncInput": {
            "name": [
                7
            ],
            "version": [
                7
            ],
            "commitSha": [
                7
            ],
            "issueReferences": [
                607
            ],
            "revertedIssueReferences": [
                607
            ],
            "pullRequestReferences": [
                608
            ],
            "repository": [
                609
            ],
            "debugSink": [
                610
            ],
            "pipelineId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueReferenceInput": {
            "identifier": [
                7
            ],
            "commitSha": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "PullRequestReferenceInput": {
            "repositoryOwner": [
                7
            ],
            "repositoryName": [
                7
            ],
            "number": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "RepositoryDataInput": {
            "owner": [
                7
            ],
            "name": [
                7
            ],
            "provider": [
                7
            ],
            "url": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseDebugSinkInput": {
            "inspectedShas": [
                7
            ],
            "issues": [
                18
            ],
            "revertedIssues": [
                18
            ],
            "pullRequests": [
                18
            ],
            "includePaths": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "version": [
                7
            ],
            "commitSha": [
                7
            ],
            "pipelineId": [
                7
            ],
            "stageId": [
                7
            ],
            "startDate": [
                17
            ],
            "targetDate": [
                17
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "version": [
                7
            ],
            "commitSha": [
                7
            ],
            "pipelineId": [
                7
            ],
            "stageId": [
                7
            ],
            "startDate": [
                17
            ],
            "targetDate": [
                17
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseCompleteInput": {
            "version": [
                7
            ],
            "commitSha": [
                7
            ],
            "pipelineId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseUpdateByPipelineInput": {
            "version": [
                7
            ],
            "stage": [
                7
            ],
            "pipelineId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                265
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseSyncInputBase": {
            "name": [
                7
            ],
            "version": [
                7
            ],
            "commitSha": [
                7
            ],
            "issueReferences": [
                607
            ],
            "revertedIssueReferences": [
                607
            ],
            "pullRequestReferences": [
                608
            ],
            "repository": [
                609
            ],
            "debugSink": [
                610
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseCompleteInputBase": {
            "version": [
                7
            ],
            "commitSha": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleaseUpdateByPipelineInputBase": {
            "version": [
                7
            ],
            "stage": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelinePayload": {
            "lastSyncId": [
                9
            ],
            "releasePipeline": [
                266
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelineCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "slugId": [
                7
            ],
            "type": [
                267
            ],
            "includePathPatterns": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelineUpdateInput": {
            "name": [
                7
            ],
            "slugId": [
                7
            ],
            "type": [
                267
            ],
            "includePathPatterns": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ReleasePipelineArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                266
            ],
            "__typename": [
                7
            ]
        },
        "ReactionPayload": {
            "lastSyncId": [
                9
            ],
            "reaction": [
                120
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ReactionCreateInput": {
            "id": [
                7
            ],
            "emoji": [
                7
            ],
            "commentId": [
                7
            ],
            "projectUpdateId": [
                7
            ],
            "initiativeUpdateId": [
                7
            ],
            "issueId": [
                7
            ],
            "postId": [
                7
            ],
            "pullRequestId": [
                7
            ],
            "pullRequestCommentId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "PushSubscriptionPayload": {
            "lastSyncId": [
                9
            ],
            "entity": [
                626
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "PushSubscription": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "PushSubscriptionCreateInput": {
            "id": [
                7
            ],
            "data": [
                7
            ],
            "type": [
                628
            ],
            "__typename": [
                7
            ]
        },
        "PushSubscriptionType": {},
        "ProjectUpdatePayload": {
            "lastSyncId": [
                9
            ],
            "projectUpdate": [
                118
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateCreateInput": {
            "id": [
                7
            ],
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "projectId": [
                7
            ],
            "health": [
                119
            ],
            "isDiffHidden": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateUpdateInput": {
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "health": [
                119
            ],
            "isDiffHidden": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                118
            ],
            "__typename": [
                7
            ]
        },
        "ProjectUpdateReminderPayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusPayload": {
            "lastSyncId": [
                9
            ],
            "status": [
                113
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "type": [
                114
            ],
            "indefinite": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusUpdateInput": {
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "type": [
                114
            ],
            "indefinite": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectStatusArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                113
            ],
            "__typename": [
                7
            ]
        },
        "ProjectRelationPayload": {
            "lastSyncId": [
                9
            ],
            "projectRelation": [
                291
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectRelationCreateInput": {
            "id": [
                7
            ],
            "type": [
                7
            ],
            "projectId": [
                7
            ],
            "projectMilestoneId": [
                7
            ],
            "anchorType": [
                7
            ],
            "relatedProjectId": [
                7
            ],
            "relatedProjectMilestoneId": [
                7
            ],
            "relatedAnchorType": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectRelationUpdateInput": {
            "type": [
                7
            ],
            "projectId": [
                7
            ],
            "projectMilestoneId": [
                7
            ],
            "anchorType": [
                7
            ],
            "relatedProjectId": [
                7
            ],
            "relatedProjectMilestoneId": [
                7
            ],
            "relatedAnchorType": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestonePayload": {
            "lastSyncId": [
                9
            ],
            "projectMilestone": [
                172
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "descriptionData": [
                18
            ],
            "targetDate": [
                17
            ],
            "projectId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "descriptionData": [
                18
            ],
            "targetDate": [
                17
            ],
            "sortOrder": [
                9
            ],
            "projectId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneMovePayload": {
            "lastSyncId": [
                9
            ],
            "projectMilestone": [
                172
            ],
            "success": [
                12
            ],
            "previousIssueTeamIds": [
                645
            ],
            "previousProjectTeamIds": [
                646
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneMoveIssueToTeam": {
            "issueId": [
                7
            ],
            "teamId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneMoveProjectTeams": {
            "projectId": [
                7
            ],
            "teamIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneMoveInput": {
            "projectId": [
                7
            ],
            "newIssueTeamId": [
                7
            ],
            "addIssueTeamToProject": [
                12
            ],
            "undoIssueTeamIds": [
                648
            ],
            "undoProjectTeamIds": [
                649
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneMoveIssueToTeamInput": {
            "issueId": [
                7
            ],
            "teamId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectMilestoneMoveProjectTeamsInput": {
            "projectId": [
                7
            ],
            "teamIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabelPayload": {
            "lastSyncId": [
                9
            ],
            "projectLabel": [
                253
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabelCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "color": [
                7
            ],
            "parentId": [
                7
            ],
            "isGroup": [
                12
            ],
            "retiredAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "ProjectLabelUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "parentId": [
                7
            ],
            "color": [
                7
            ],
            "isGroup": [
                12
            ],
            "retiredAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationPayload": {
            "lastSyncId": [
                9
            ],
            "organization": [
                8
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationUpdateInput": {
            "name": [
                7
            ],
            "logoUrl": [
                7
            ],
            "urlKey": [
                7
            ],
            "gitBranchFormat": [
                7
            ],
            "gitLinkbackMessagesEnabled": [
                12
            ],
            "gitPublicLinkbackMessagesEnabled": [
                12
            ],
            "gitLinkbackDescriptionsEnabled": [
                12
            ],
            "roadmapEnabled": [
                12
            ],
            "projectUpdateReminderFrequencyInWeeks": [
                9
            ],
            "projectUpdateRemindersDay": [
                112
            ],
            "projectUpdateRemindersHour": [
                9
            ],
            "initiativeUpdateReminderFrequencyInWeeks": [
                9
            ],
            "initiativeUpdateRemindersDay": [
                112
            ],
            "initiativeUpdateRemindersHour": [
                9
            ],
            "fiscalYearStartMonth": [
                9
            ],
            "workingDays": [
                9
            ],
            "reducedPersonalInformation": [
                12
            ],
            "oauthAppReview": [
                12
            ],
            "allowedAuthServices": [
                7
            ],
            "slaEnabled": [
                12
            ],
            "restrictAgentInvocationToMembers": [
                12
            ],
            "ipRestrictions": [
                655
            ],
            "allowedFileUploadContentTypes": [
                7
            ],
            "themeSettings": [
                18
            ],
            "customersEnabled": [
                12
            ],
            "customersConfiguration": [
                18
            ],
            "codeIntelligenceEnabled": [
                12
            ],
            "codeIntelligenceRepository": [
                7
            ],
            "feedEnabled": [
                12
            ],
            "hideNonPrimaryOrganizations": [
                12
            ],
            "defaultFeedSummarySchedule": [
                178
            ],
            "aiAddonEnabled": [
                12
            ],
            "generatedUpdatesEnabled": [
                12
            ],
            "aiTelemetryEnabled": [
                12
            ],
            "aiDiscussionSummariesEnabled": [
                12
            ],
            "aiThreadSummariesEnabled": [
                12
            ],
            "hipaaComplianceEnabled": [
                12
            ],
            "securitySettings": [
                656
            ],
            "aiProviderConfiguration": [
                18
            ],
            "slackProjectChannelIntegrationId": [
                7
            ],
            "slackProjectChannelPrefix": [
                7
            ],
            "linearAgentEnabled": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationIpRestrictionInput": {
            "range": [
                7
            ],
            "type": [
                7
            ],
            "description": [
                7
            ],
            "enabled": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationSecuritySettingsInput": {
            "personalApiKeysRole": [
                445
            ],
            "invitationsRole": [
                445
            ],
            "teamCreationRole": [
                445
            ],
            "labelManagementRole": [
                445
            ],
            "apiSettingsRole": [
                445
            ],
            "templateManagementRole": [
                445
            ],
            "importRole": [
                445
            ],
            "agentGuidanceRole": [
                445
            ],
            "integrationCreationRole": [
                445
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDeletePayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "DeleteOrganizationInput": {
            "deletionCode": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationCancelDeletePayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationStartTrialPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationStartTrialInput": {
            "planType": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInvitePayload": {
            "lastSyncId": [
                9
            ],
            "organizationInvite": [
                444
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInviteCreateInput": {
            "id": [
                7
            ],
            "email": [
                7
            ],
            "role": [
                445
            ],
            "teamIds": [
                7
            ],
            "metadata": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationInviteUpdateInput": {
            "teamIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDomainSimplePayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDomainPayload": {
            "lastSyncId": [
                9
            ],
            "organizationDomain": [
                667
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDomain": {
            "id": [
                4
            ],
            "createdAt": [
                5
            ],
            "updatedAt": [
                5
            ],
            "archivedAt": [
                5
            ],
            "identityProvider": [
                356
            ],
            "name": [
                7
            ],
            "verified": [
                12
            ],
            "verificationEmail": [
                7
            ],
            "creator": [
                6
            ],
            "authType": [
                668
            ],
            "claimed": [
                12
            ],
            "disableOrganizationCreation": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDomainAuthType": {},
        "OrganizationDomainVerificationInput": {
            "organizationDomainId": [
                7
            ],
            "verificationCode": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDomainCreateInput": {
            "id": [
                7
            ],
            "identityProviderId": [
                7
            ],
            "name": [
                7
            ],
            "verificationEmail": [
                7
            ],
            "authType": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OrganizationDomainUpdateInput": {
            "disableOrganizationCreation": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "NotificationSubscriptionPayload": {
            "lastSyncId": [
                9
            ],
            "notificationSubscription": [
                1
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "NotificationSubscriptionCreateInput": {
            "id": [
                7
            ],
            "customerId": [
                7
            ],
            "customViewId": [
                7
            ],
            "cycleId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "labelId": [
                7
            ],
            "projectId": [
                7
            ],
            "teamId": [
                7
            ],
            "userId": [
                7
            ],
            "contextViewType": [
                155
            ],
            "userContextViewType": [
                309
            ],
            "notificationSubscriptionTypes": [
                7
            ],
            "active": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "NotificationSubscriptionUpdateInput": {
            "notificationSubscriptionTypes": [
                7
            ],
            "active": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "NotificationPayload": {
            "lastSyncId": [
                9
            ],
            "notification": [
                374
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "NotificationUpdateInput": {
            "readAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "projectUpdateId": [
                7
            ],
            "initiativeUpdateId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotificationBatchActionPayload": {
            "lastSyncId": [
                9
            ],
            "notifications": [
                374
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "NotificationEntityInput": {
            "issueId": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "projectUpdateId": [
                7
            ],
            "initiativeUpdateId": [
                7
            ],
            "oauthClientApprovalId": [
                7
            ],
            "id": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotificationArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                374
            ],
            "__typename": [
                7
            ]
        },
        "IssueToReleasePayload": {
            "lastSyncId": [
                9
            ],
            "issueToRelease": [
                458
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueToReleaseCreateInput": {
            "id": [
                7
            ],
            "issueId": [
                7
            ],
            "releaseId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssuePayload": {
            "lastSyncId": [
                9
            ],
            "issue": [
                16
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueCreateInput": {
            "id": [
                7
            ],
            "title": [
                7
            ],
            "description": [
                7
            ],
            "descriptionData": [
                117
            ],
            "assigneeId": [
                7
            ],
            "delegateId": [
                7
            ],
            "parentId": [
                7
            ],
            "priority": [
                105
            ],
            "estimate": [
                105
            ],
            "subscriberIds": [
                7
            ],
            "labelIds": [
                7
            ],
            "teamId": [
                7
            ],
            "cycleId": [
                7
            ],
            "projectId": [
                7
            ],
            "projectMilestoneId": [
                7
            ],
            "lastAppliedTemplateId": [
                7
            ],
            "stateId": [
                7
            ],
            "referenceCommentId": [
                7
            ],
            "sourceCommentId": [
                7
            ],
            "sourcePullRequestCommentId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "subIssueSortOrder": [
                9
            ],
            "dueDate": [
                17
            ],
            "createAsUser": [
                7
            ],
            "displayIconUrl": [
                7
            ],
            "preserveSortOrderOnCreate": [
                12
            ],
            "createdAt": [
                5
            ],
            "slaBreachesAt": [
                5
            ],
            "slaStartedAt": [
                5
            ],
            "templateId": [
                7
            ],
            "completedAt": [
                5
            ],
            "slaType": [
                351
            ],
            "useDefaultTemplate": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueBatchPayload": {
            "lastSyncId": [
                9
            ],
            "issues": [
                16
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueBatchCreateInput": {
            "issues": [
                683
            ],
            "__typename": [
                7
            ]
        },
        "IssueUpdateInput": {
            "title": [
                7
            ],
            "description": [
                7
            ],
            "descriptionData": [
                117
            ],
            "assigneeId": [
                7
            ],
            "delegateId": [
                7
            ],
            "parentId": [
                7
            ],
            "priority": [
                105
            ],
            "estimate": [
                105
            ],
            "subscriberIds": [
                7
            ],
            "labelIds": [
                7
            ],
            "addedLabelIds": [
                7
            ],
            "removedLabelIds": [
                7
            ],
            "teamId": [
                7
            ],
            "cycleId": [
                7
            ],
            "projectId": [
                7
            ],
            "projectMilestoneId": [
                7
            ],
            "lastAppliedTemplateId": [
                7
            ],
            "stateId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "prioritySortOrder": [
                9
            ],
            "subIssueSortOrder": [
                9
            ],
            "dueDate": [
                17
            ],
            "trashed": [
                12
            ],
            "slaBreachesAt": [
                5
            ],
            "slaStartedAt": [
                5
            ],
            "snoozedUntilAt": [
                5
            ],
            "snoozedById": [
                7
            ],
            "slaType": [
                351
            ],
            "autoClosedByParentClosing": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "UUID": {},
        "IssueArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                16
            ],
            "__typename": [
                7
            ]
        },
        "IssueRelationPayload": {
            "lastSyncId": [
                9
            ],
            "issueRelation": [
                312
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueRelationCreateInput": {
            "id": [
                7
            ],
            "type": [
                691
            ],
            "issueId": [
                7
            ],
            "relatedIssueId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueRelationType": {},
        "IssueRelationUpdateInput": {
            "type": [
                7
            ],
            "issueId": [
                7
            ],
            "relatedIssueId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabelPayload": {
            "lastSyncId": [
                9
            ],
            "issueLabel": [
                250
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabelCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "color": [
                7
            ],
            "parentId": [
                7
            ],
            "teamId": [
                7
            ],
            "isGroup": [
                12
            ],
            "retiredAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "IssueLabelUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "parentId": [
                7
            ],
            "color": [
                7
            ],
            "isGroup": [
                12
            ],
            "retiredAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "IssueImportPayload": {
            "lastSyncId": [
                9
            ],
            "issueImport": [
                301
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueImportDeletePayload": {
            "lastSyncId": [
                9
            ],
            "issueImport": [
                301
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IssueImportUpdateInput": {
            "mapping": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationsSettingsPayload": {
            "lastSyncId": [
                9
            ],
            "integrationsSettings": [
                154
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationsSettingsCreateInput": {
            "slackIssueCreated": [
                12
            ],
            "slackIssueAddedToView": [
                12
            ],
            "slackIssueNewComment": [
                12
            ],
            "slackIssueStatusChangedDone": [
                12
            ],
            "slackIssueStatusChangedAll": [
                12
            ],
            "slackProjectUpdateCreated": [
                12
            ],
            "slackProjectUpdateCreatedToTeam": [
                12
            ],
            "slackProjectUpdateCreatedToWorkspace": [
                12
            ],
            "slackInitiativeUpdateCreated": [
                12
            ],
            "slackIssueAddedToTriage": [
                12
            ],
            "slackIssueSlaHighRisk": [
                12
            ],
            "slackIssueSlaBreached": [
                12
            ],
            "id": [
                7
            ],
            "teamId": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "customViewId": [
                7
            ],
            "contextViewType": [
                155
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationsSettingsUpdateInput": {
            "slackIssueCreated": [
                12
            ],
            "slackIssueAddedToView": [
                12
            ],
            "slackIssueNewComment": [
                12
            ],
            "slackIssueStatusChangedDone": [
                12
            ],
            "slackIssueStatusChangedAll": [
                12
            ],
            "slackProjectUpdateCreated": [
                12
            ],
            "slackProjectUpdateCreatedToTeam": [
                12
            ],
            "slackProjectUpdateCreatedToWorkspace": [
                12
            ],
            "slackInitiativeUpdateCreated": [
                12
            ],
            "slackIssueAddedToTriage": [
                12
            ],
            "slackIssueSlaHighRisk": [
                12
            ],
            "slackIssueSlaBreached": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationTemplatePayload": {
            "lastSyncId": [
                9
            ],
            "integrationTemplate": [
                469
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationTemplateCreateInput": {
            "id": [
                7
            ],
            "integrationId": [
                7
            ],
            "templateId": [
                7
            ],
            "foreignEntityId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationPayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationUpdateInput": {
            "settings": [
                706
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationSettingsInput": {
            "slack": [
                707
            ],
            "slackAsks": [
                708
            ],
            "slackPost": [
                712
            ],
            "slackProjectPost": [
                712
            ],
            "slackInitiativePost": [
                712
            ],
            "slackCustomViewNotifications": [
                712
            ],
            "slackOrgProjectUpdatesPost": [
                712
            ],
            "slackOrgInitiativeUpdatesPost": [
                712
            ],
            "googleSheets": [
                714
            ],
            "gitHub": [
                716
            ],
            "gitHubImport": [
                721
            ],
            "gitHubPersonal": [
                722
            ],
            "gitLab": [
                723
            ],
            "sentry": [
                724
            ],
            "zendesk": [
                725
            ],
            "intercom": [
                726
            ],
            "front": [
                727
            ],
            "gong": [
                728
            ],
            "microsoftTeams": [
                730
            ],
            "jira": [
                731
            ],
            "notion": [
                734
            ],
            "opsgenie": [
                735
            ],
            "pagerDuty": [
                736
            ],
            "launchDarkly": [
                737
            ],
            "jiraPersonal": [
                738
            ],
            "salesforce": [
                739
            ],
            "__typename": [
                7
            ]
        },
        "SlackSettingsInput": {
            "teamName": [
                7
            ],
            "teamId": [
                7
            ],
            "enterpriseName": [
                7
            ],
            "enterpriseId": [
                7
            ],
            "shouldUnfurl": [
                12
            ],
            "shouldUseDefaultUnfurl": [
                12
            ],
            "externalUserActions": [
                12
            ],
            "linkOnIssueIdMention": [
                12
            ],
            "enableAgent": [
                12
            ],
            "enableLinearAgentWorkflowAccess": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SlackAsksSettingsInput": {
            "teamName": [
                7
            ],
            "teamId": [
                7
            ],
            "enterpriseName": [
                7
            ],
            "enterpriseId": [
                7
            ],
            "shouldUnfurl": [
                12
            ],
            "shouldUseDefaultUnfurl": [
                12
            ],
            "externalUserActions": [
                12
            ],
            "slackChannelMapping": [
                709
            ],
            "canAdministrate": [
                445
            ],
            "customerVisibility": [
                711
            ],
            "enableAgent": [
                12
            ],
            "enableLinearAgentWorkflowAccess": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SlackChannelNameMappingInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "isPrivate": [
                12
            ],
            "isShared": [
                12
            ],
            "botAdded": [
                12
            ],
            "teams": [
                710
            ],
            "autoCreateOnMessage": [
                12
            ],
            "autoCreateOnEmoji": [
                12
            ],
            "autoCreateOnBotMention": [
                12
            ],
            "autoCreateTemplateId": [
                7
            ],
            "postCancellationUpdates": [
                12
            ],
            "postCompletionUpdates": [
                12
            ],
            "postAcceptedFromTriageUpdates": [
                12
            ],
            "aiTitles": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SlackAsksTeamSettingsInput": {
            "id": [
                7
            ],
            "hasDefaultAsk": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomerVisibilityMode": {},
        "SlackPostSettingsInput": {
            "channel": [
                7
            ],
            "channelId": [
                7
            ],
            "configurationUrl": [
                7
            ],
            "teamId": [
                7
            ],
            "channelType": [
                713
            ],
            "__typename": [
                7
            ]
        },
        "SlackChannelType": {},
        "GoogleSheetsSettingsInput": {
            "spreadsheetId": [
                7
            ],
            "spreadsheetUrl": [
                7
            ],
            "sheetId": [
                9
            ],
            "updatedIssuesAt": [
                5
            ],
            "issue": [
                715
            ],
            "project": [
                715
            ],
            "initiative": [
                715
            ],
            "__typename": [
                7
            ]
        },
        "GoogleSheetsExportSettings": {
            "enabled": [
                12
            ],
            "spreadsheetId": [
                7
            ],
            "spreadsheetUrl": [
                7
            ],
            "sheetId": [
                9
            ],
            "updatedAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "GitHubSettingsInput": {
            "pullRequestReviewTool": [
                717
            ],
            "orgAvatarUrl": [
                7
            ],
            "orgLogin": [
                7
            ],
            "repositories": [
                718
            ],
            "repositoriesMapping": [
                719
            ],
            "orgType": [
                720
            ],
            "codeAccess": [
                12
            ],
            "enterpriseUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "PullRequestReviewTool": {},
        "GitHubRepoInput": {
            "id": [
                9
            ],
            "fullName": [
                7
            ],
            "archived": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "GitHubRepoMappingInput": {
            "id": [
                7
            ],
            "linearTeamId": [
                7
            ],
            "gitHubRepoId": [
                9
            ],
            "gitHubLabels": [
                7
            ],
            "bidirectional": [
                12
            ],
            "default": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "GithubOrgType": {},
        "GitHubImportSettingsInput": {
            "orgLogin": [
                7
            ],
            "orgAvatarUrl": [
                7
            ],
            "repositories": [
                718
            ],
            "labels": [
                18
            ],
            "orgType": [
                720
            ],
            "__typename": [
                7
            ]
        },
        "GitHubPersonalSettingsInput": {
            "login": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitLabSettingsInput": {
            "url": [
                7
            ],
            "readonly": [
                12
            ],
            "expiresAt": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "SentrySettingsInput": {
            "organizationSlug": [
                7
            ],
            "organizationId": [
                4
            ],
            "resolvingCompletesIssues": [
                12
            ],
            "unresolvingReopensIssues": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ZendeskSettingsInput": {
            "sendNoteOnStatusChange": [
                12
            ],
            "sendNoteOnComment": [
                12
            ],
            "automateTicketReopeningOnCompletion": [
                12
            ],
            "automateTicketReopeningOnCancellation": [
                12
            ],
            "automateTicketReopeningOnComment": [
                12
            ],
            "disableCustomerRequestsAutoCreation": [
                12
            ],
            "automateTicketReopeningOnProjectCompletion": [
                12
            ],
            "automateTicketReopeningOnProjectCancellation": [
                12
            ],
            "enableAiIntake": [
                12
            ],
            "subdomain": [
                7
            ],
            "url": [
                7
            ],
            "botUserId": [
                7
            ],
            "canReadCustomers": [
                12
            ],
            "supportsOAuthRefresh": [
                12
            ],
            "hostMappings": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IntercomSettingsInput": {
            "sendNoteOnStatusChange": [
                12
            ],
            "sendNoteOnComment": [
                12
            ],
            "automateTicketReopeningOnCompletion": [
                12
            ],
            "automateTicketReopeningOnCancellation": [
                12
            ],
            "automateTicketReopeningOnComment": [
                12
            ],
            "disableCustomerRequestsAutoCreation": [
                12
            ],
            "automateTicketReopeningOnProjectCompletion": [
                12
            ],
            "automateTicketReopeningOnProjectCancellation": [
                12
            ],
            "enableAiIntake": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "FrontSettingsInput": {
            "sendNoteOnStatusChange": [
                12
            ],
            "sendNoteOnComment": [
                12
            ],
            "automateTicketReopeningOnCompletion": [
                12
            ],
            "automateTicketReopeningOnCancellation": [
                12
            ],
            "automateTicketReopeningOnComment": [
                12
            ],
            "disableCustomerRequestsAutoCreation": [
                12
            ],
            "automateTicketReopeningOnProjectCompletion": [
                12
            ],
            "automateTicketReopeningOnProjectCancellation": [
                12
            ],
            "enableAiIntake": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "GongSettingsInput": {
            "importConfig": [
                729
            ],
            "__typename": [
                7
            ]
        },
        "GongRecordingImportConfigInput": {
            "teamId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "MicrosoftTeamsSettingsInput": {
            "tenantName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "JiraSettingsInput": {
            "projectMapping": [
                732
            ],
            "projects": [
                733
            ],
            "isJiraServer": [
                12
            ],
            "setupPending": [
                12
            ],
            "manualSetup": [
                12
            ],
            "label": [
                7
            ],
            "statusNamesPerIssueType": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "JiraLinearMappingInput": {
            "jiraProjectId": [
                7
            ],
            "linearTeamId": [
                7
            ],
            "bidirectional": [
                12
            ],
            "default": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "JiraProjectDataInput": {
            "id": [
                7
            ],
            "key": [
                7
            ],
            "name": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "NotionSettingsInput": {
            "workspaceId": [
                7
            ],
            "workspaceName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "OpsgenieInput": {
            "apiFailedWithUnauthorizedErrorAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "PagerDutyInput": {
            "apiFailedWithUnauthorizedErrorAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "LaunchDarklySettingsInput": {
            "projectKey": [
                7
            ],
            "environment": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "JiraPersonalSettingsInput": {
            "siteName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "SalesforceSettingsInput": {
            "sendNoteOnStatusChange": [
                12
            ],
            "sendNoteOnComment": [
                12
            ],
            "automateTicketReopeningOnCompletion": [
                12
            ],
            "automateTicketReopeningOnCancellation": [
                12
            ],
            "automateTicketReopeningOnComment": [
                12
            ],
            "disableCustomerRequestsAutoCreation": [
                12
            ],
            "automateTicketReopeningOnProjectCompletion": [
                12
            ],
            "automateTicketReopeningOnProjectCancellation": [
                12
            ],
            "enableAiIntake": [
                12
            ],
            "subdomain": [
                7
            ],
            "url": [
                7
            ],
            "reopenCaseStatus": [
                7
            ],
            "restrictVisibility": [
                12
            ],
            "defaultTeam": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitHubCommitIntegrationPayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "webhookSecret": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitHubEnterpriseServerPayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "setupUrl": [
                7
            ],
            "installUrl": [
                7
            ],
            "webhookSecret": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitLabIntegrationCreatePayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "webhookSecret": [
                7
            ],
            "error": [
                7
            ],
            "errorResponseBody": [
                7
            ],
            "errorResponseHeaders": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitLabTestConnectionPayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "error": [
                7
            ],
            "errorResponseBody": [
                7
            ],
            "errorResponseHeaders": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AirbyteConfigurationInput": {
            "apiKey": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "JiraConfigurationInput": {
            "accessToken": [
                7
            ],
            "email": [
                7
            ],
            "hostname": [
                7
            ],
            "manualSetup": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "JiraUpdateInput": {
            "id": [
                7
            ],
            "updateProjects": [
                12
            ],
            "updateMetadata": [
                12
            ],
            "deleteWebhook": [
                12
            ],
            "webhookSecret": [
                7
            ],
            "noSecret": [
                12
            ],
            "accessToken": [
                7
            ],
            "email": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "JiraFetchProjectStatusesPayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "issueStatuses": [
                7
            ],
            "projectStatuses": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "JiraFetchProjectStatusesInput": {
            "integrationId": [
                7
            ],
            "projectId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationCustomerDataAttributesRefreshInput": {
            "service": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationSlackWorkspaceNamePayload": {
            "name": [
                7
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AsksChannelConnectPayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "mapping": [
                752
            ],
            "addBot": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SlackChannelNameMapping": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "isPrivate": [
                12
            ],
            "isShared": [
                12
            ],
            "botAdded": [
                12
            ],
            "teams": [
                753
            ],
            "autoCreateOnMessage": [
                12
            ],
            "autoCreateOnEmoji": [
                12
            ],
            "autoCreateOnBotMention": [
                12
            ],
            "autoCreateTemplateId": [
                7
            ],
            "postCancellationUpdates": [
                12
            ],
            "postCompletionUpdates": [
                12
            ],
            "postAcceptedFromTriageUpdates": [
                12
            ],
            "aiTitles": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SlackAsksTeamSettings": {
            "id": [
                7
            ],
            "hasDefaultAsk": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "SlackChannelConnectPayload": {
            "lastSyncId": [
                9
            ],
            "integration": [
                263
            ],
            "success": [
                12
            ],
            "addBot": [
                12
            ],
            "nudgeToConnectMainSlackIntegration": [
                12
            ],
            "nudgeToUpdateMainSlackIntegration": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationRequestPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "IntegrationRequestInput": {
            "email": [
                7
            ],
            "name": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdatePayload": {
            "lastSyncId": [
                9
            ],
            "initiativeUpdate": [
                131
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateCreateInput": {
            "id": [
                7
            ],
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "health": [
                132
            ],
            "initiativeId": [
                7
            ],
            "isDiffHidden": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateUpdateInput": {
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "health": [
                132
            ],
            "isDiffHidden": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                131
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateReminderPayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeToProjectPayload": {
            "lastSyncId": [
                9
            ],
            "initiativeToProject": [
                275
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeToProjectCreateInput": {
            "id": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeToProjectUpdateInput": {
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "InitiativePayload": {
            "lastSyncId": [
                9
            ],
            "initiative": [
                129
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "ownerId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "color": [
                7
            ],
            "icon": [
                7
            ],
            "status": [
                130
            ],
            "targetDate": [
                17
            ],
            "targetDateResolution": [
                115
            ],
            "content": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "ownerId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "color": [
                7
            ],
            "icon": [
                7
            ],
            "targetDate": [
                17
            ],
            "status": [
                130
            ],
            "targetDateResolution": [
                115
            ],
            "trashed": [
                12
            ],
            "content": [
                7
            ],
            "updateReminderFrequencyInWeeks": [
                9
            ],
            "updateReminderFrequency": [
                9
            ],
            "frequencyResolution": [
                111
            ],
            "updateRemindersDay": [
                112
            ],
            "updateRemindersHour": [
                105
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                129
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeRelationPayload": {
            "lastSyncId": [
                9
            ],
            "initiativeRelation": [
                475
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeRelationCreateInput": {
            "id": [
                7
            ],
            "initiativeId": [
                7
            ],
            "relatedInitiativeId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "InitiativeRelationUpdateInput": {
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationTargetBranchPayload": {
            "lastSyncId": [
                9
            ],
            "targetBranch": [
                340
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationTargetBranchCreateInput": {
            "id": [
                7
            ],
            "teamId": [
                7
            ],
            "branchPattern": [
                7
            ],
            "isRegex": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationTargetBranchUpdateInput": {
            "branchPattern": [
                7
            ],
            "isRegex": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationStatePayload": {
            "lastSyncId": [
                9
            ],
            "gitAutomationState": [
                339
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationStateCreateInput": {
            "id": [
                7
            ],
            "teamId": [
                7
            ],
            "stateId": [
                7
            ],
            "targetBranchId": [
                7
            ],
            "event": [
                341
            ],
            "__typename": [
                7
            ]
        },
        "GitAutomationStateUpdateInput": {
            "stateId": [
                7
            ],
            "targetBranchId": [
                7
            ],
            "event": [
                341
            ],
            "__typename": [
                7
            ]
        },
        "FavoritePayload": {
            "lastSyncId": [
                9
            ],
            "favorite": [
                210
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "FavoriteCreateInput": {
            "id": [
                7
            ],
            "folderName": [
                7
            ],
            "parentId": [
                7
            ],
            "issueId": [
                7
            ],
            "facetId": [
                7
            ],
            "projectId": [
                7
            ],
            "projectTab": [
                211
            ],
            "predefinedViewType": [
                7
            ],
            "predefinedViewTeamId": [
                7
            ],
            "cycleId": [
                7
            ],
            "customViewId": [
                7
            ],
            "documentId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "initiativeTab": [
                212
            ],
            "labelId": [
                7
            ],
            "projectLabelId": [
                7
            ],
            "userId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "customerId": [
                7
            ],
            "dashboardId": [
                7
            ],
            "pullRequestId": [
                7
            ],
            "releaseId": [
                7
            ],
            "releasePipelineId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "FavoriteUpdateInput": {
            "sortOrder": [
                9
            ],
            "parentId": [
                7
            ],
            "folderName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EventTrackingPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EventTrackingInput": {
            "event": [
                7
            ],
            "properties": [
                18
            ],
            "sessionId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EntityExternalLinkPayload": {
            "lastSyncId": [
                9
            ],
            "entityExternalLink": [
                153
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EntityExternalLinkCreateInput": {
            "id": [
                7
            ],
            "url": [
                7
            ],
            "label": [
                7
            ],
            "initiativeId": [
                7
            ],
            "projectId": [
                7
            ],
            "teamId": [
                7
            ],
            "releaseId": [
                7
            ],
            "cycleId": [
                7
            ],
            "resourceFolderId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "EntityExternalLinkUpdateInput": {
            "url": [
                7
            ],
            "label": [
                7
            ],
            "sortOrder": [
                9
            ],
            "resourceFolderId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EmojiPayload": {
            "lastSyncId": [
                9
            ],
            "emoji": [
                481
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EmojiCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "url": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EmailUnsubscribePayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EmailUnsubscribeInput": {
            "type": [
                7
            ],
            "token": [
                7
            ],
            "userId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EmailIntakeAddressPayload": {
            "lastSyncId": [
                9
            ],
            "emailIntakeAddress": [
                482
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EmailIntakeAddressCreateInput": {
            "id": [
                7
            ],
            "type": [
                483
            ],
            "forwardingEmailAddress": [
                7
            ],
            "senderName": [
                7
            ],
            "teamId": [
                7
            ],
            "templateId": [
                7
            ],
            "repliesEnabled": [
                12
            ],
            "useUserNamesInReplies": [
                12
            ],
            "issueCreatedAutoReplyEnabled": [
                12
            ],
            "issueCreatedAutoReply": [
                7
            ],
            "issueCompletedAutoReplyEnabled": [
                12
            ],
            "issueCompletedAutoReply": [
                7
            ],
            "issueCanceledAutoReplyEnabled": [
                12
            ],
            "issueCanceledAutoReply": [
                7
            ],
            "customerRequestsEnabled": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EmailIntakeAddressUpdateInput": {
            "enabled": [
                12
            ],
            "forwardingEmailAddress": [
                7
            ],
            "senderName": [
                7
            ],
            "teamId": [
                7
            ],
            "templateId": [
                7
            ],
            "repliesEnabled": [
                12
            ],
            "useUserNamesInReplies": [
                12
            ],
            "issueCreatedAutoReplyEnabled": [
                12
            ],
            "issueCreatedAutoReply": [
                7
            ],
            "issueCompletedAutoReplyEnabled": [
                12
            ],
            "issueCompletedAutoReply": [
                7
            ],
            "issueCanceledAutoReplyEnabled": [
                12
            ],
            "issueCanceledAutoReply": [
                7
            ],
            "customerRequestsEnabled": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "DocumentPayload": {
            "lastSyncId": [
                9
            ],
            "document": [
                109
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "DocumentCreateInput": {
            "id": [
                7
            ],
            "title": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "content": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "teamId": [
                7
            ],
            "issueId": [
                7
            ],
            "releaseId": [
                7
            ],
            "cycleId": [
                7
            ],
            "resourceFolderId": [
                7
            ],
            "lastAppliedTemplateId": [
                7
            ],
            "sortOrder": [
                9
            ],
            "subscriberIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "DocumentUpdateInput": {
            "title": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "content": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "teamId": [
                7
            ],
            "issueId": [
                7
            ],
            "releaseId": [
                7
            ],
            "cycleId": [
                7
            ],
            "resourceFolderId": [
                7
            ],
            "lastAppliedTemplateId": [
                7
            ],
            "hiddenAt": [
                5
            ],
            "sortOrder": [
                9
            ],
            "trashed": [
                12
            ],
            "subscriberIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "DocumentArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                109
            ],
            "__typename": [
                7
            ]
        },
        "CyclePayload": {
            "lastSyncId": [
                9
            ],
            "cycle": [
                21
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CycleCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "teamId": [
                7
            ],
            "startsAt": [
                5
            ],
            "endsAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "CycleUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "startsAt": [
                5
            ],
            "endsAt": [
                5
            ],
            "completedAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "CycleArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                21
            ],
            "__typename": [
                7
            ]
        },
        "CycleShiftAllInput": {
            "id": [
                7
            ],
            "daysToShift": [
                9
            ],
            "__typename": [
                7
            ]
        },
        "CustomerTierPayload": {
            "lastSyncId": [
                9
            ],
            "tier": [
                259
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomerTierCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "displayName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerTierUpdateInput": {
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "displayName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusPayload": {
            "lastSyncId": [
                9
            ],
            "status": [
                257
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "displayName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerStatusUpdateInput": {
            "name": [
                7
            ],
            "color": [
                7
            ],
            "description": [
                7
            ],
            "position": [
                9
            ],
            "displayName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerPayload": {
            "lastSyncId": [
                9
            ],
            "customer": [
                256
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomerCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "domains": [
                7
            ],
            "externalIds": [
                7
            ],
            "slackChannelId": [
                7
            ],
            "ownerId": [
                7
            ],
            "statusId": [
                7
            ],
            "revenue": [
                105
            ],
            "size": [
                105
            ],
            "tierId": [
                7
            ],
            "logoUrl": [
                7
            ],
            "mainSourceId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerUpdateInput": {
            "name": [
                7
            ],
            "domains": [
                7
            ],
            "externalIds": [
                7
            ],
            "slackChannelId": [
                7
            ],
            "ownerId": [
                7
            ],
            "statusId": [
                7
            ],
            "revenue": [
                105
            ],
            "size": [
                105
            ],
            "tierId": [
                7
            ],
            "logoUrl": [
                7
            ],
            "mainSourceId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerUpsertInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "domains": [
                7
            ],
            "externalId": [
                7
            ],
            "slackChannelId": [
                7
            ],
            "ownerId": [
                7
            ],
            "statusId": [
                7
            ],
            "revenue": [
                105
            ],
            "size": [
                105
            ],
            "tierId": [
                7
            ],
            "logoUrl": [
                7
            ],
            "tierName": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedPayload": {
            "lastSyncId": [
                9
            ],
            "need": [
                260
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedCreateInput": {
            "id": [
                7
            ],
            "customerId": [
                7
            ],
            "customerExternalId": [
                7
            ],
            "issueId": [
                7
            ],
            "projectId": [
                7
            ],
            "commentId": [
                7
            ],
            "attachmentId": [
                7
            ],
            "priority": [
                9
            ],
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "attachmentUrl": [
                7
            ],
            "createAsUser": [
                7
            ],
            "displayIconUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedCreateFromAttachmentInput": {
            "attachmentId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedUpdatePayload": {
            "lastSyncId": [
                9
            ],
            "need": [
                260
            ],
            "success": [
                12
            ],
            "updatedRelatedNeeds": [
                260
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedUpdateInput": {
            "id": [
                7
            ],
            "customerId": [
                7
            ],
            "customerExternalId": [
                7
            ],
            "issueId": [
                7
            ],
            "projectId": [
                7
            ],
            "priority": [
                9
            ],
            "applyPriorityToRelatedNeeds": [
                12
            ],
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "attachmentUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CustomerNeedArchivePayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "entity": [
                260
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewPayload": {
            "lastSyncId": [
                9
            ],
            "customView": [
                215
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewCreateInput": {
            "id": [
                7
            ],
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "teamId": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "ownerId": [
                7
            ],
            "filterData": [
                22
            ],
            "projectFilterData": [
                73
            ],
            "initiativeFilterData": [
                67
            ],
            "feedItemFilterData": [
                245
            ],
            "shared": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CustomViewUpdateInput": {
            "name": [
                7
            ],
            "description": [
                7
            ],
            "icon": [
                7
            ],
            "color": [
                7
            ],
            "teamId": [
                7
            ],
            "projectId": [
                7
            ],
            "initiativeId": [
                7
            ],
            "ownerId": [
                7
            ],
            "filterData": [
                22
            ],
            "projectFilterData": [
                73
            ],
            "initiativeFilterData": [
                67
            ],
            "feedItemFilterData": [
                245
            ],
            "shared": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ContactPayload": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "ContactCreateInput": {
            "type": [
                7
            ],
            "message": [
                7
            ],
            "operatingSystem": [
                7
            ],
            "browser": [
                7
            ],
            "device": [
                7
            ],
            "clientVersion": [
                7
            ],
            "disappointmentRating": [
                105
            ],
            "__typename": [
                7
            ]
        },
        "ContactSalesCreateInput": {
            "name": [
                7
            ],
            "email": [
                7
            ],
            "companySize": [
                7
            ],
            "message": [
                7
            ],
            "url": [
                7
            ],
            "distinctId": [
                7
            ],
            "sessionId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CommentPayload": {
            "lastSyncId": [
                9
            ],
            "comment": [
                121
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "CommentCreateInput": {
            "id": [
                7
            ],
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "issueId": [
                7
            ],
            "projectUpdateId": [
                7
            ],
            "initiativeUpdateId": [
                7
            ],
            "postId": [
                7
            ],
            "documentContentId": [
                7
            ],
            "parentId": [
                7
            ],
            "createAsUser": [
                7
            ],
            "displayIconUrl": [
                7
            ],
            "createdAt": [
                5
            ],
            "doNotSubscribeToIssue": [
                12
            ],
            "createOnSyncedSlackThread": [
                12
            ],
            "quotedText": [
                7
            ],
            "subscriberIds": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CommentUpdateInput": {
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "resolvingUserId": [
                7
            ],
            "resolvingCommentId": [
                7
            ],
            "quotedText": [
                7
            ],
            "subscriberIds": [
                7
            ],
            "doNotSubscribeToIssue": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "EmailUserAccountAuthChallengeResponse": {
            "success": [
                12
            ],
            "authType": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "EmailUserAccountAuthChallengeInput": {
            "email": [
                7
            ],
            "isDesktop": [
                12
            ],
            "clientAuthCode": [
                7
            ],
            "inviteLink": [
                7
            ],
            "loginCodeOnly": [
                12
            ],
            "challengeResponse": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "TokenUserAccountAuthInput": {
            "email": [
                7
            ],
            "token": [
                7
            ],
            "timezone": [
                7
            ],
            "inviteLink": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GoogleUserAccountAuthInput": {
            "code": [
                7
            ],
            "redirectUri": [
                7
            ],
            "timezone": [
                7
            ],
            "inviteLink": [
                7
            ],
            "disallowSignup": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "PasskeyLoginStartResponse": {
            "success": [
                12
            ],
            "options": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "CreateOrJoinOrganizationResponse": {
            "organization": [
                517
            ],
            "user": [
                516
            ],
            "__typename": [
                7
            ]
        },
        "OnboardingCustomerSurvey": {
            "companyRole": [
                7
            ],
            "companySize": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "CreateOrganizationInput": {
            "name": [
                7
            ],
            "urlKey": [
                7
            ],
            "domainAccess": [
                12
            ],
            "timezone": [
                7
            ],
            "utm": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "JoinOrganizationInput": {
            "organizationId": [
                7
            ],
            "inviteLink": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "LogoutResponse": {
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentPayload": {
            "lastSyncId": [
                9
            ],
            "attachment": [
                261
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentCreateInput": {
            "id": [
                7
            ],
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "url": [
                7
            ],
            "issueId": [
                7
            ],
            "iconUrl": [
                7
            ],
            "metadata": [
                18
            ],
            "groupBySource": [
                12
            ],
            "commentBody": [
                7
            ],
            "commentBodyData": [
                18
            ],
            "createAsUser": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AttachmentUpdateInput": {
            "title": [
                7
            ],
            "subtitle": [
                7
            ],
            "metadata": [
                18
            ],
            "iconUrl": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "GitLinkKind": {},
        "FrontAttachmentPayload": {
            "lastSyncId": [
                9
            ],
            "attachment": [
                261
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionPayload": {
            "lastSyncId": [
                9
            ],
            "success": [
                12
            ],
            "agentSession": [
                180
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionCreateOnComment": {
            "commentId": [
                7
            ],
            "externalLink": [
                7
            ],
            "externalUrls": [
                844
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionExternalUrlInput": {
            "url": [
                7
            ],
            "label": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionCreateOnIssue": {
            "issueId": [
                7
            ],
            "externalLink": [
                7
            ],
            "externalUrls": [
                844
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionCreateInput": {
            "id": [
                7
            ],
            "issueId": [
                7
            ],
            "appUserId": [
                7
            ],
            "context": [
                18
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionUpdateExternalUrlInput": {
            "externalLink": [
                7
            ],
            "externalUrls": [
                844
            ],
            "addedExternalUrls": [
                844
            ],
            "removedExternalUrls": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionUpdateInput": {
            "externalLink": [
                7
            ],
            "externalUrls": [
                844
            ],
            "addedExternalUrls": [
                844
            ],
            "removedExternalUrls": [
                7
            ],
            "plan": [
                18
            ],
            "dismissedAt": [
                5
            ],
            "userState": [
                849
            ],
            "__typename": [
                7
            ]
        },
        "AgentSessionUserStateInput": {
            "userId": [
                7
            ],
            "lastReadAt": [
                5
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityPayload": {
            "lastSyncId": [
                9
            ],
            "agentActivity": [
                184
            ],
            "success": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityCreateInput": {
            "id": [
                7
            ],
            "agentSessionId": [
                7
            ],
            "signal": [
                193
            ],
            "signalMetadata": [
                18
            ],
            "contextualMetadata": [
                18
            ],
            "content": [
                18
            ],
            "ephemeral": [
                12
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityCreatePromptInput": {
            "id": [
                7
            ],
            "agentSessionId": [
                7
            ],
            "signal": [
                193
            ],
            "signalMetadata": [
                18
            ],
            "contextualMetadata": [
                18
            ],
            "content": [
                853
            ],
            "sourceCommentId": [
                7
            ],
            "__typename": [
                7
            ]
        },
        "AgentActivityPromptCreateInputContent": {
            "type": [
                187
            ],
            "body": [
                7
            ],
            "bodyData": [
                117
            ],
            "__typename": [
                7
            ]
        }
    }
}