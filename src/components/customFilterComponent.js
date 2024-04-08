(() => ({
  name: 'Filter',
  type: 'CONTAINER_COMPONENT',
  allowedTypes: [],
  orientation: 'HORIZONTAL',
  jsx: (() => {
    const { env, Icon, getProperty } = B;
    const { MenuItem, TextField, Button, ButtonGroup, IconButton, Checkbox } =
      window.MaterialUI.Core;
    const { DateFnsUtils } = window.MaterialUI;
    const {
      MuiPickersUtilsProvider,
      KeyboardDatePicker,
      KeyboardDateTimePicker,
    } = window.MaterialUI.Pickers;

    const {
      modelId,
      propertyWhiteList,
      propertyBlackList,
      actionVariableId: name,
    } = options;
    const isDev = env === 'dev';
    const { properties } = !isDev ? artifact : { properties: {} };

    const makeId = (length = 16) => {
      let result = '';
      const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const charactersLength = characters.length;
      for (let i = 0; i < length; i += 1) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength),
        );
      }
      return result;
    };

    const initialState = [
      {
        id: makeId(),
        operator: '_and',
        groups: [],
        rows: [
          {
            rowId: makeId(),
            propertyValue: '',
            operator: 'eq',
            rightValue: '',
          },
        ],
      },
    ];

    const [groups, setGroups] = React.useState(initialState);
    const [groupsOperator, setGroupsOperator] = React.useState('_and');

    const [filter, setFilter] = useState(null);

    const stringKinds = [
      'string',
      'string_expression',
      'email_address',
      'zipcode',
      'url',
      'text',
      'text_expression',
      'rich_text',
      'auto_increment',
      'phone_number',
      'iban',
    ];
    const numberKinds = [
      'serial',
      'count',
      'decimal',
      'decimal_expression',
      'float',
      'integer',
      'integer_expression',
      'price',
      'price_expression',
      'minutes',
    ];
    const dateKinds = ['date', 'date_expression'];
    const dateTimeKinds = ['date_time_expression', 'date_time', 'time'];
    const booleanKinds = ['boolean', 'boolean_expression'];
    const forbiddenKinds = [
      'has_and_belongs_to_many',
      'has_one',
      'image',
      'file',
      'password',
      'pdf',
      'multi_image',
      'multi_file',
    ];
    const operatorList = [
      {
        operator: 'eq',
        label: 'Is gelijk aan',
        kinds: ['*'],
      },
      {
        operator: 'neq',
        label: 'Is niet gelijk aan',
        kinds: ['*'],
      },
      {
        operator: 'ex',
        label: 'Bestaat',
        kinds: ['*'],
      },
      {
        operator: 'nex',
        label: 'Bestaat niet',
        kinds: ['*'],
      },
      {
        operator: 'starts_with',
        label: 'Start met',
        kinds: [...stringKinds],
      },
      {
        operator: 'ends_with',
        label: 'Eindigt met',
        kinds: [...stringKinds],
      },
      {
        operator: 'matches',
        label: 'Bevat',
        kinds: [...stringKinds],
      },
      {
        operator: 'does_not_match',
        label: 'Bevat niet',
        kinds: [...stringKinds],
      },
      {
        operator: 'gt',
        label: 'Is groter dan',
        kinds: [...numberKinds],
      },
      {
        operator: 'lt',
        label: 'Kleiner dan',
        kinds: [...numberKinds],
      },
      {
        operator: 'gteq',
        label: 'Groter dan of gelijk aan',
        kinds: [...numberKinds],
      },
      {
        operator: 'lteq',
        label: 'Kleiner dan of gelijk aan',
        kinds: [...numberKinds],
      },
      {
        operator: 'gt',
        label: 'Is na',
        kinds: [...dateKinds, ...dateTimeKinds],
      },
      {
        operator: 'lt',
        label: 'Is voor',
        kinds: [...dateKinds, ...dateTimeKinds],
      },
      {
        operator: 'gteg',
        label: 'Is na of op',
        kinds: [...dateKinds, ...dateTimeKinds],
      },
      {
        operator: 'lteq',
        label: 'Is voor of op',
        kinds: [...dateKinds, ...dateTimeKinds],
      },
    ];

    B.defineFunction('Add filter group', () => {
      setGroups([
        ...groups,
        {
          id: makeId(),
          operator: '_and',
          groups: [],
          rows: [
            {
              rowId: makeId(),
              propertyValue: '',
              operator: 'eq',
              rightValue: '',
            },
          ],
        },
      ]);
    });

    B.defineFunction('Reset advanced filter', () => {
      handleSetFilterGroups(initialState);
    });

    const filterProps = (properties, id, inverseId = '') => {
      return Object.values(properties).filter((prop) => {
        return (
          // Add all properties besides the forbidden
          prop.modelId === id &&
          !forbiddenKinds.includes(prop.kind) &&
          (inverseId === '' || inverseId !== prop.id)
        );
      });
    };

    const filterOperators = (kind = '') => {
      if (!kind) return operatorList;
      return operatorList.filter((op) => {
        return op.kinds.includes(kind) || op.kinds.includes('*');
      });
    };

    const makeFilterChild = (prop, op, right) => {
      // The prop is stored as a string with a dot notation that represents the path to the property

      const constructObject = (prop, value) => {
        // Construct an object from a string with dot notation
        // Example: 'user.name' => { user: { name: value } }
        const keys = prop.split('.');
        const last = keys.pop();
        const newObj = {};
        let current = newObj;
        keys.forEach((key) => {
          current[key] = {};
          current = current[key];
        });
        current[last] = value;
        return newObj;
      };

      switch (op) {
        case 'ex':
          return constructObject(prop, {
            exists: true,
          });
        case 'nex':
          return constructObject(prop, {
            does_not_exist: 0,
          });
        default:
          return constructObject(prop, {
            [op]: right,
          });
      }
    };

    const makeFilter = (tree) => {
      return {
        where: {
          [groupsOperator]: tree.map((node) => {
            return {
              [node.operator]: node.rows.map((subnode) => {
                return makeFilterChild(
                  subnode.propertyValue,
                  subnode.operator,
                  subnode.rightValue,
                );
              }),
            };
          }),
        },
      };
    };

    const makeReadableFilter = (tree) => {
      return {
        where: {
          [groupsOperator]: tree.map((node) => {
            return {
              [node.operator]: node.rows.map((subnode) => {
                // Get the key of the propertyValue. This is the id of the property
                if (typeof subnode.propertyValue === 'string') {
                  const propertyInfo = getProperty(subnode.propertyValue);
                  // Use the id  of the property to get its information
                  // Get the name of the property from the propertyInfo
                  const propertyName = propertyInfo.name;

                  return makeFilterChild(
                    propertyName,
                    subnode.operator,
                    subnode.rightValue,
                  );
                }
                if (typeof subnode.propertyValue === 'object') {
                  const key = Object.keys(subnode.propertyValue)[0];
                  const value = Object.values(subnode.propertyValue)[0];
                  const modelInfo = getProperty(key);
                  const modelName = modelInfo.name;
                  const propertyInfo = getProperty(value);
                  const propertyName = propertyInfo.name;

                  return makeFilterChild(
                    { [modelName]: propertyName },
                    subnode.operator,
                    subnode.rightValue,
                  );
                }
              }),
            };
          }),
        },
      };
    };

    const updateGroupProperty = (
      groupId,
      groups,
      propertyToUpdate,
      newValue,
    ) => {
      return groups.map((group) => {
        if (group.id === groupId) {
          const newGroup = group;
          newGroup[propertyToUpdate] = newValue;
          return newGroup;
        }
        const foundGroup = group.groups.filter((g) => g.id === groupId);
        if (foundGroup.length === 0) {
          // eslint-disable-next-line no-param-reassign
          group.groups = updateGroupProperty(
            groupId,
            group.groups,
            propertyToUpdate,
            newValue,
          );
          return group;
        }
        group.groups.map((grp) => {
          const newGroup = grp;
          if (grp.id === groupId) {
            newGroup[propertyToUpdate] = newValue;
          }
          return newGroup;
        });
        return group;
      });
    };

    const deleteFilter = (group, rowId) => {
      return group.map((group) => {
        const foundRow = group.rows.filter((row) => row.rowId === rowId);
        if (foundRow.length === 0) {
          // eslint-disable-next-line no-param-reassign
          group.groups = deleteFilter(group.groups, rowId);
          return group;
        }
        // eslint-disable-next-line no-param-reassign
        group.rows = group.rows.filter((row) => row.rowId !== rowId);
        return group;
      });
    };

    const mapWhitelist = (input = '') => {
      const lines = input.split(',');
      const result = {};

      lines.forEach((line) => {
        if (line.trim() === '') return;
        const properties = line.trim().split('.');
        let currentObject = result;
        properties.forEach((property, index) => {
          if (!currentObject[property]) {
            if (index === properties.length - 1) {
              // Last property, set to true
              currentObject[property] = true;
            } else {
              // Not the last property, create a new level
              currentObject[property] = {};
            }
          }
          currentObject = currentObject[property];
        });
      });

      return result;
    };

    const mapProperties = (
      properties,
      id,
      iteration,
      whitelist = {},
      parent = '',
    ) => {
      if (iteration === undefined) iteration = 0;
      if (iteration > 5) return [];

      let filteredProps = filterProps(properties, id, parent);
      if (Object.keys(whitelist).length > 0) {
        filteredProps = filteredProps.filter(
          (prop) => !whitelist || whitelist[prop.name],
        );
      }

      const tree = filteredProps
        .filter((prop) => {
          // Prevent recursion by checking if the inverse association is not the same as the parent
          return parent === '' || parent !== prop.inverseAssociationId;
        })
        .map((prop) => {
          if (
            (prop.kind === 'belongs_to' || prop.kind === 'has_many') &&
            iteration !== 5
          ) {
            const props = mapProperties(
              properties,
              prop.referenceModelId,
              iteration + 1,
              whitelist ? whitelist[prop.name] : undefined,
              prop.id,
            );
            return {
              ...prop,
              properties: props,
            };
          }
          return {
            ...prop,
            properties: [],
          };
        })
        .sort((a, b) => {
          // Locale compare to sort alphabetically
          return a.label.localeCompare(b.label);
        });
      return tree;
    };

    const filterMappedProperties = (properties = [], id = '') => {
      // Always return the first property if no id is given
      if (id === '') return properties[0];
      return properties.find((prop) => prop.id === id);
    };

    const PropertySelector = ({
      properties = [],
      onChange = () => undefined,
      selectedProperty = '',
    }) => {
      return (
        <>
          <TextField
            defaultValue=""
            value={selectedProperty}
            classes={{ root: classes.textFieldHighlight }}
            size="small"
            variant="outlined"
            style={{ marginRight: '10px', width: '100%' }}
            onChange={onChange}
            select
            name={`property-${selectedProperty}`}
          >
            {properties.map(({ id, label, properties }) => {
              const appendix = properties.length > 0 ? ' »' : '';
              return (
                <MenuItem key={id} value={id}>
                  {label + appendix}
                </MenuItem>
              );
            })}
          </TextField>
        </>
      );
    };

    const getGroup = (groupId) => {
      return groups.find((group) => group.id === groupId);
    };

    const getLeftValue = (leftValue, level = 0) => {
      const value = leftValue.split('.');
      return value[level];
    };

    const LeftValueInput = ({
      properties = [],
      level = 0,
      setRowPropertyValue = (value = '', properties = [], level = 0) => {},
      leftValue = '',
    }) => {
      const [value, setValue] = useState(getLeftValue(leftValue, level));
      const prop = filterMappedProperties(properties, value);

      const onChange = (e) => {
        const value = e.target.value;
        setValue(value);
        setRowPropertyValue(value, properties, level);
      };

      return (
        <>
          <PropertySelector
            properties={properties}
            selectedProperty={value}
            onChange={onChange}
          />
          {prop && prop.properties.length > 0 && (
            <LeftValueInput
              properties={prop.properties}
              level={level + 1}
              setRowPropertyValue={setRowPropertyValue}
              leftValue={leftValue}
            />
          )}
        </>
      );
    };

    const OperatorSwitch = ({
      prop = '',
      setOperatorValue = () => {},
      operator: value = 'eq',
    }) => {
      const operators = filterOperators(prop ? prop.kind : '');
      const [operator, setOperator] = useState(value);

      const onChange = (e) => {
        const value = e.target.value;
        setOperator(value);
        setOperatorValue(value);
      };

      return (
        <TextField
          size="small"
          value={operator}
          classes={{ root: classes.textFieldHighlight }}
          style={{ width: '30rem' }}
          fullWidth
          variant="outlined"
          select
          onChange={onChange}
        >
          {operators.map(({ operator, label }) => {
            return (
              <MenuItem key={operator} value={operator}>
                {label}
              </MenuItem>
            );
          })}
        </TextField>
      );
    };
    const handleSetFilterGroups = useCallback((newGroups) => {
      setGroups(newGroups);
    }, []);

    const RightValueInput = ({
      prop,
      operator,
      setRightValue = (value) => {},
      rightValue: value = '',
    }) => {
      if (operator === 'ex' || operator === 'nex') {
        return <></>;
      }

      const [rightValue, setRightValueState] = useState(value);

      const handleBlur = (e) => {
        setRightValue(rightValue);
      };

      const isNumberType = numberKinds.includes(prop.kind);
      const isDateType = dateKinds.includes(prop.kind);
      const isDateTimeType = dateTimeKinds.includes(prop.kind);
      const isBooleanType = booleanKinds.includes(prop.kind);
      const isListType = prop.kind === 'list';
      const isSpecialType = operator === 'ex' || operator === 'nex';

      const handleChange = (e) => {
        const { type } = e.target.dataset;

        if (type === 'date') {
          const d = new Date(e);
          const newRightValue = d.toISOString().split('T')[0];
          setRightValueState(newRightValue);
        } else if (type === 'checkbox') {
          const newRightValue = e.target.checked;
          setRightValueState(newRightValue);
          setRightValue(newRightValue);
        } else if (type === 'number') {
          const value = e.target.value;
          let newRightValue = Number(value);
          setRightValueState(newRightValue);
        } else {
          const value = e.target.value;
          let newRightValue = value;
          setRightValueState(newRightValue);
        }
      };

      const handleChangeDate = (date, type = 'date') => {
        let newRightValue = '';
        if (type === 'date') {
          newRightValue = date.toISOString().split('T')[0];
        } else {
          newRightValue = date.toISOString();
        }
        setRightValueState(newRightValue);
      };

      if (isSpecialType) {
        return null;
      }

      if (isNumberType) {
        return (
          <TextField
            size="small"
            value={rightValue}
            classes={{ root: classes.textFieldHighlight }}
            style={{ width: '100%' }}
            type="number"
            fullWidth
            variant="outlined"
            onChange={handleChange}
            onBlur={handleBlur}
            inputProps={{
              'data-type': 'number',
            }}
          />
        );
      }

      if (isDateType) {
        // Set default value for date
        if (rightValue === '') {
          const today = new Date();
          setRightValue(today.toISOString().split('T')[0]);
          // Trigger onBlur to bring inital value to the row
        }

        return (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              margin="none"
              classes={{
                toolbar: classes.datePicker,
                daySelected: classes.datePicker,
                root: classes.textFieldHighlight,
              }}
              size="small"
              value={rightValue === '' ? null : rightValue}
              initialFocusedDate={new Date()}
              style={{ width: '100%', margin: '0px' }}
              variant="inline"
              ampm={false}
              inputVariant="outlined"
              format="dd-MM-yyyy"
              inputProps={{
                'data-type': 'number',
              }}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
              allowKeyboardControl={true}
              onChange={(date) => {
                handleChangeDate(date, 'date');
              }}
              onBlur={handleBlur}
            />
          </MuiPickersUtilsProvider>
        );
      }

      if (isDateTimeType) {
        // Set default value for date
        if (rightValue === '') {
          const today = new Date();
          setRightValue(today.toISOString());
        }

        return (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDateTimePicker
              margin="none"
              classes={{
                toolbar: classes.datePicker,
                daySelected: classes.datePicker,
                root: classes.textFieldHighlight,
              }}
              size="small"
              value={rightValue === '' ? null : rightValue}
              initialFocusedDate={new Date()}
              style={{ width: '100%', margin: '0px' }}
              variant="inline"
              ampm={false}
              inputVariant="outlined"
              format="dd-MM-yyyy HH:mm"
              inputProps={{
                'data-type': 'number',
              }}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
              allowKeyboardControl={true}
              onChange={(date) => handleChangeDate(date, 'dateTime')}
              onBlur={handleBlur}
            />
          </MuiPickersUtilsProvider>
        );
      }

      if (isBooleanType) {
        // Set default value for boolean
        if (rightValue === '') {
          setRightValue(false);
        }

        return (
          <Checkbox
            checked={rightValue}
            classes={{ root: classes.checkBox }}
            inputProps={{
              'data-type': 'checkbox',
            }}
            onChange={handleChange}
          />
        );
      }

      if (isListType) {
        // Set default value for list
        if (rightValue === '' && prop.values.length > 0) {
          setRightValue(prop.values[0].value);
        }
        return (
          <TextField
            select
            size="small"
            value={rightValue}
            classes={{ root: classes.textFieldHighlight }}
            style={{ width: '100%' }}
            fullWidth
            variant="outlined"
            inputProps={{
              'data-type': 'list',
            }}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            {prop.values.map(({ value }) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
        );
      }

      // Return standard text input by default
      return (
        <TextField
          size="small"
          value={rightValue}
          classes={{ root: classes.textFieldHighlight }}
          style={{ width: '100%' }}
          type="text"
          fullWidth
          variant="outlined"
          inputProps={{
            'data-type': 'text',
          }}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );
    };

    const updateRow = (rowId, newRow) => {
      const newGroups = groups.map((group) => {
        const newGroup = group;
        newGroup.rows = group.rows.map((row) => {
          if (row.rowId === rowId) {
            return newRow;
          }
          return row;
        });
        return newGroup;
      });

      handleSetFilterGroups(newGroups);
    };

    const FilterRow = ({ row = {}, removeable = false }) => {
      if (!modelId) return <p>Please select a model</p>;

      const mappedWhiteList = mapWhitelist(propertyWhiteList);
      const mappedProperties = mapProperties(
        properties,
        modelId,
        0,
        mappedWhiteList,
      );

      const [filter, setFilter] = useState(row);

      // Set default value for propertyValue
      if (row.propertyValue === '' && mappedProperties.length > 0) {
        row.propertyValue = mappedProperties[0].id;
      }

      useEffect(() => {
        if (!filter) return;
        if (filter === row) return;
        updateRow(row.rowId, filter);
      }, [filter]);

      const setPropertyValue = (
        propertyValue = '',
        properties = [],
        level = 0,
      ) => {
        const property = filterMappedProperties(properties, propertyValue);
        // Split the current value
        let currentValue = filter.propertyValue.split('.');
        // Set the value of the current level
        currentValue[level] = propertyValue;

        if (property.kind === 'belongs_to' || property.kind === 'has_many') {
          // If the property is a relation, add a default level
          currentValue[level + 1] = properties[0].id;
        }

        if (currentValue.length > level + 1) {
          // Remove all values after the current level
          currentValue = currentValue.slice(0, level + 1);
        }

        currentValue = currentValue.join('.');
        const newFilter = {
          ...filter,
          propertyValue: currentValue,
          rightValue: '', // Reset the right value when the property changes
        };
        setFilter(newFilter);
      };

      const setOperatorValue = (operator) => {
        const newFilter = { ...filter, operator };
        setFilter(newFilter);
      };

      const setRightValue = (rightValue) => {
        const newFilter = { ...filter, rightValue };
        setFilter(newFilter);
      };

      const deleteRow = (e) => {
        e.preventDefault();
        handleSetFilterGroups(deleteFilter(groups, row.rowId));
      };

      const amountOfLevels = filter.propertyValue.split('.').length;
      const currentProperty = getProperty(
        filter.propertyValue.split('.')[amountOfLevels - 1],
      );

      return (
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                width: '100%',
              }}
            >
              <LeftValueInput
                properties={mappedProperties}
                setRowPropertyValue={setPropertyValue}
                leftValue={row.propertyValue}
              />
            </div>
            <OperatorSwitch
              prop={currentProperty}
              setOperatorValue={setOperatorValue}
              operator={row.operator}
            />
            <RightValueInput
              prop={currentProperty}
              operator={row.operator}
              setRightValue={setRightValue}
              rightValue={row.rightValue}
            />
            {removeable && (
              <IconButton aria-label="delete" onClick={deleteRow}>
                <Icon name="Delete" fontSize="small" />
              </IconButton>
            )}
          </div>
        </div>
      );
    };

    const FilterRowDev = () => {
      return (
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <TextField
            select
            size="small"
            variant="outlined"
            style={{ marginRight: '10px', width: '33%', pointerEvents: 'none' }}
          />
          <TextField
            size="small"
            select
            variant="outlined"
            style={{ marginRight: '10px', width: '15%', pointerEvents: 'none' }}
          />
          <TextField
            size="small"
            type="text"
            style={{ width: '33%', pointerEvents: 'none' }}
            variant="outlined"
          />
          <IconButton aria-label="delete" style={{ pointerEvents: 'none' }}>
            <Icon name="Delete" fontSize="small" />
          </IconButton>
        </div>
      );
    };

    const addFilter = (tree, groupId) => {
      const newRow = {
        rowId: makeId(),
        propertyValue: '',
        operator: 'eq',
        rightValue: '',
      };

      return tree.map((group) => {
        if (group.id === groupId) {
          group.rows.push(newRow);
          return group;
        }
        // eslint-disable-next-line no-param-reassign
        group.groups = addFilter(group.groups, groupId);
        return group;
      });
    };

    const AddFilterRowButton = ({ group }) => {
      const handleAddGroup = (e) => {
        e.preventDefault();

        handleSetFilterGroups(addFilter(groups, group.id));
      };
      return (
        <Button
          type="button"
          style={{
            textTransform: 'none',
            pointerEvents: isDev ? 'none' : 'all',
          }}
          onClick={handleAddGroup}
        >
          <Icon name="Add" fontSize="small" />
          Filter rij toevoegen 
        </Button>
      );
    };

    const deleteGroup = (tree, groupId) => {
      const newTree = tree.slice();
      const foundIndex = newTree.findIndex((g) => g.id === groupId);

      if (foundIndex > -1) {
        newTree.splice(foundIndex, 1);
      }
      return newTree;
    };

    const AndOrOperatorSwitch = ({ groupId }) => {
      const group = getGroup(groupId);

      const handleOnClick = (e) => {
        const operator = e.currentTarget.getAttribute('data-value');
        handleSetFilterGroups(
          updateGroupProperty(group.id, groups, 'operator', operator),
        );
      };
      return (
        <ButtonGroup
          size="small"
          className={classes.operator}
          style={{ pointerEvents: isDev ? 'none' : 'all' }}
        >
          <Button
            disableElevation
            variant="contained"
            classes={{ containedPrimary: classes.highlight }}
            color={group.operator === '_and' ? 'primary' : 'default'}
            data-value="_and"
            onClick={handleOnClick}
          >
           en 
          </Button>
          <Button
            disableElevation
            variant="contained"
            classes={{ containedPrimary: classes.highlight }}
            color={group.operator === '_or' ? 'primary' : 'default'}
            onClick={handleOnClick}
            data-value="_or"
          >
            of
          </Button>
        </ButtonGroup>
      );
    };

    const handleDeleteGroup = (e) => {
      e.preventDefault();
      const groupId = e.currentTarget.getAttribute('data-value');
      const newGroups = deleteGroup(groups, groupId);
      handleSetFilterGroups(newGroups);
    };

    const handleSetGroupsOperator = (e) => {
      e.preventDefault();
      const newGroupsOperator = e.currentTarget.getAttribute('data-value');
      setGroupsOperator(newGroupsOperator);
    };

    const RenderGroups = ({ groups }) => {
      const mapRows = (group) => {
        console.log('mapRows', group);
        return group.rows.map((row, i) => {
          return (
            <>
              {i > 0 && <hr />}
              <FilterRow
                row={row}
                removeable={group.rows.length > 1}
                key={`filter-row-${row.rowId}`}
              />
            </>
          );
        });
      };

      return (
        <>
          <input type="hidden" name={name} value={JSON.stringify(filter)} />
          {groups.map((group, index) => (
            <div key={`group-${group.id}`}>
              <div className={classes.filter}>
                {groups.length > 1 && (
                  <div className={classes.deleteGroup}>
                    <IconButton
                      type="button"
                      onClick={handleDeleteGroup}
                      data-value={group.id}
                      title="Delete group"
                    >
                      <Icon name="Delete" fontSize="small" />
                    </IconButton>
                  </div>
                )}
                <AndOrOperatorSwitch groupId={group.id} />
                <div style={{ marginTop: groups.length > 1 ? '30px' : '' }}>
                  {isDev ? <FilterRowDev /> : mapRows(group)}
                </div>
                <AddFilterRowButton group={group} />
              </div>
              {index + 1 < groups.length && (
                <ButtonGroup
                  size="small"
                  style={{ pointerEvents: isDev ? 'none' : 'all' }}
                >
                  <Button
                    disableElevation
                    variant="contained"
                    color={groupsOperator === '_and' ? 'primary' : 'default'}
                    classes={{ containedPrimary: classes.highlight }}
                    onClick={handleSetGroupsOperator}
                    data-value="_and"
                  >
                    en 
                  </Button>
                  <Button
                    disableElevation
                    variant="contained"
                    color={groupsOperator === '_or' ? 'primary' : 'default'}
                    classes={{ containedPrimary: classes.highlight }}
                    onClick={handleSetGroupsOperator}
                    data-value="_or"
                  >
                    of
                  </Button>
                </ButtonGroup>
              )}
            </div>
          ))}
        </>
      );
    };

    B.defineFunction('Apply filter', () => {
      try {
        console.info('Applying filter... Please wait');
        handleApplyFilter();
      } catch (exception) {
        console.error(
          'An error occurred while applying the filter:',
          exception,
        );
      }
    });

    const handleApplyFilter = () => {
      const newFilter = makeFilter(groups);

      console.info('Filter for datatable ready! Output:');
      console.info(newFilter);

      B.triggerEvent('onSubmit', newFilter);
    };

    return (
      <div className={classes.root}>
        <RenderGroups key={`render-group`} groups={groups} />
      </div>
    );
  })(),
  styles: (B) => (theme) => {
    const { env, Styling, mediaMinWidth } = B;
    const isDev = env === 'dev';
    const style = new Styling(theme);
    const getSpacing = (idx, device = 'Mobile') =>
      idx === '0' ? '0rem' : style.getSpacing(idx, device);

    return {
      root: {
        marginTop: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[0]),
        marginRight: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[1]),
        marginBottom: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[2]),
        marginLeft: ({ options: { outerSpacing } }) =>
          getSpacing(outerSpacing[3]),
        [`@media ${mediaMinWidth(600)}`]: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Portrait'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Portrait'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Portrait'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Portrait'),
        },
        [`@media ${mediaMinWidth(960)}`]: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Landscape'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Landscape'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Landscape'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Landscape'),
        },
        [`@media ${mediaMinWidth(1280)}`]: {
          marginTop: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[0], 'Desktop'),
          marginRight: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[1], 'Desktop'),
          marginBottom: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[2], 'Desktop'),
          marginLeft: ({ options: { outerSpacing } }) =>
            getSpacing(outerSpacing[3], 'Desktop'),
        },
        width: ({ options: { width } }) => !isDev && width,
        height: ({ options: { height } }) => (isDev ? '100%' : height),
        minHeight: 0,
      },
      textFieldHighlight: {
        '& .MuiInputBase-root': {
          '&.Mui-focused, &.Mui-focused:hover': {
            '& .MuiOutlinedInput-notchedOutline, & .MuiFilledInput-underline, & .MuiInput-underline':
              {
                borderColor: ({ options: { highlightColor } }) => [
                  style.getColor(highlightColor),
                  '!important',
                ],
              },
          },
        },
      },
      checkBox: {
        color: ({ options: { highlightColor } }) => [
          style.getColor(highlightColor),
          '!important',
        ],
      },
      datePicker: {
        backgroundColor: ({ options: { highlightColor } }) => [
          style.getColor(highlightColor),
          '!important',
        ],
      },
      saveButton: {
        backgroundColor: ({ options: { highlightColor } }) => [
          style.getColor(highlightColor),
          '!important',
        ],
        color: ({ options: { textColor } }) => [
          style.getColor(textColor),
          '!important',
        ],
        float: 'right',
      },
      addFilterButton: {
        borderColor: ({ options: { highlightColor } }) => [
          style.getColor(highlightColor),
          '!important',
        ],
        border: '1px solid',
      },
      highlight: {
        backgroundColor: ({ options: { highlightColor } }) => [
          style.getColor(highlightColor),
          '!important',
        ],
      },
      icons: {
        color: ({ options: { highlightColor } }) => [
          style.getColor(highlightColor),
          '!important',
        ],
      },
      filter: {
        border: '1px solid',
        borderRadius: ({ options: { borderRadius } }) => borderRadius,
        borderColor: ({ options: { borderColor } }) => [
          style.getColor(borderColor),
          '!important',
        ],
        padding: '15px',
        marginTop: '15px',
        marginBottom: '15px',
        position: 'relative',
        backgroundColor: ({ options: { backgroundColor } }) => [
          style.getColor(backgroundColor),
          '!important',
        ],
      },
      filterInput: {
        width: '33%',
      },
      operator: {
        position: 'absolute',
        height: '25px',
        margin: '0px',
        bottom: '15px',
        right: '15px',
      },
      deleteGroup: {
        margin: '0px',
        position: 'absolute',
        top: '0',
        right: '0',
      },
      pristine: {
        borderWidth: '0.0625rem',
        borderColor: '#AFB5C8',
        borderStyle: 'dashed',
        backgroundColor: '#F0F1F5',
        display: ['flex', '!important'],
        justifyContent: ['center', '!important'],
        alignItems: 'center',
        height: ['2.5rem', '!important'],
        fontSize: '0.75rem',
        color: '#262A3A',
        textTransform: 'uppercase',
      },
    };
  },
}))();
