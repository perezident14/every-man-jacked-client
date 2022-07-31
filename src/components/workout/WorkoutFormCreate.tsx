import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Delete, FitnessCenterRounded, KeyboardBackspace } from '@mui/icons-material';
import { Avatar, Box, Button, Container, createTheme, CssBaseline, Divider, FormControl, Grid, IconButton, List, ListItem, ListItemText, MenuItem, TextField, ThemeProvider, Typography } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useExerciseContext } from '../../context/exercise.context';
import { useFeedbackContext } from '../../context/feedback.context';
import { useSessionContext } from '../../context/session.context';
import { useWorkoutContext } from '../../context/workout.context';
import { Workout, WorkoutCategory } from '../../models/workout.model';
import ExerciseModal from './ExerciseModal';
import { createWorkout, parseWorkout, initialWorkoutData, saveWorkoutToUser, parseExerciseCategories } from './workout.service';
import { Exercise } from '../../models/exercise.model';
import ConfirmationModal from './ConfirmationModal';
import { refresh } from '../../api/auth.api';

const WorkoutFormCreate: React.FC = () => {

  const theme = createTheme();
  const exerciseContext = useExerciseContext();
  const feedbackContext = useFeedbackContext();
  const sessionContext = useSessionContext();
  const workoutContext = useWorkoutContext();

  const [confirmationCategory, setConfirmationCategory] = useState<WorkoutCategory>();
  const [openConfirmationModal, setOpenConfirmationModal] = useState<boolean>(false);
  const [openExerciseModal, setOpenExerciseModal] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSetWorkout = (newWorkout: Workout) => {
    const updatedWorkouts = [...workoutContext.workouts];
    updatedWorkouts.push(newWorkout);
    workoutContext.setWorkouts(updatedWorkouts);
  };

  const handleSetUserWorkout = (newWorkoutId: string) => {
    const updatedUserWorkouts = [...sessionContext.user.workouts];
    updatedUserWorkouts.push(newWorkoutId);
    sessionContext.setSession(
      true,
      {
        ...sessionContext.user,
        workouts: updatedUserWorkouts,
      },
    );
  };

  const handleCreateWorkout = (workout: Workout) => {
    console.log('saving')
    createWorkout(workout)
      .then((response) => response.data)
      .then((data) => {
        const workoutData = parseWorkout(data);
        handleSetWorkout(workoutData);
        handleSetUserWorkout(workoutData._id!);
        saveWorkoutToUser(sessionContext.user, workoutData._id!)
          .then(() => {
            refresh();
            feedbackContext.setFeedback({
              message: 'Workout Created!',
              open: true,
              type: 0
            });
            navigate(`/workouts/${workoutData._id}/edit`);
          })
          .catch((error) => {
            if (typeof error === 'object') {
              feedbackContext.setFeedback({
                message: error.response.data ?? error.message, 
                error: true,
                open: true,
              });
            } else {
              feedbackContext.setFeedback({
                message: error, 
                error: true,
                open: true,
              });
            }
          });
      })
      .catch((error) => {
        if (typeof error === 'object') {
          feedbackContext.setFeedback({
            message: error.response.data ?? error.message, 
            error: true,
            open: true,
          });
        } else {
          feedbackContext.setFeedback({
            message: error, 
            error: true,
            open: true,
          });
        }
      });
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required(),
    category: Yup.string().oneOf(Object.values(WorkoutCategory)).required(),
    exercises: Yup.array(),
    // exercises: Yup.array().of(Yup.string()),
  });

  const formik = useFormik({
    initialValues: initialWorkoutData,
    validationSchema,
    onSubmit: (values: Workout) => {
      console.log('save', values);
      handleCreateWorkout(values);
    }
  });

  const handleAddExercise = (exerciseId: string) => {
    const updatedExercises = [...formik.values.exercises];
    updatedExercises.push({
      id: exerciseId,
      sets: [],
    });
    formik.setFieldValue('exercises', updatedExercises);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    const updatedExercises = [...formik.values.exercises];
    const index = updatedExercises.findIndex((exercise) => exercise.id === exerciseId);
    if (index >= 0) {
      updatedExercises.splice(index, 1);
    }
    formik.setFieldValue('exercises', updatedExercises);
  };

  const handleChangeCategory = () => {
    formik.setFieldValue('category', confirmationCategory);
    formik.setFieldValue('exercises', []);
    setConfirmationCategory(undefined);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmationCategory(undefined);
    setOpenConfirmationModal(false);
  };

  const readExerciseById = (exerciseId: string): Exercise => {
    const exerciseData = exerciseContext.exercises.find((exercise) => exercise._id === exerciseId);
    if (exerciseData) {
      return exerciseData;
    }

    return {
      title: '',
      categories: [],
    } as Exercise;
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component='main' maxWidth='md'>
        <CssBaseline />
        <Button onClick={() => navigate('/workouts')} sx={{ display: 'flex', position: 'absolute', marginTop: -4 }}>
          <KeyboardBackspace />
          &nbsp;
          Back to Workouts
        </Button>
        <Box sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', marginTop: 8 }}>
          <Avatar sx={{ margin: 1, backgroundColor: 'secondary' }}>
            <FitnessCenterRounded />
          </Avatar>
          <Typography component='h1' variant='h5'>
            Create Workout
          </Typography>

          <FormControl fullWidth>
            <Box component='form' onSubmit={formik.handleSubmit} sx={{ marginTop: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    error={formik.touched.title && Boolean(formik.errors.title)}
                    helperText={formik.touched.title && formik.errors.title}
                    name='title'
                    label='Title'
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    value={formik.values.category}
                    onChange={(e) => {
                      setConfirmationCategory(e.target.value as WorkoutCategory);
                      setOpenConfirmationModal(true);
                    }}
                    error={formik.touched.category && Boolean(formik.errors.category)}
                    helperText={formik.touched.category && formik.errors.category}
                    name='category'
                    label='Category'
                  >
                    <MenuItem key={WorkoutCategory.CHEST} value={WorkoutCategory.CHEST}>Chest</MenuItem>
                    <MenuItem key={WorkoutCategory.BACK} value={WorkoutCategory.BACK}>Back</MenuItem>
                    <MenuItem key={WorkoutCategory.ARMS} value={WorkoutCategory.ARMS}>Arms</MenuItem>
                    <MenuItem key={WorkoutCategory.SHOULDERS} value={WorkoutCategory.SHOULDERS}>Shoulders</MenuItem>
                    <MenuItem key={WorkoutCategory.LEGS} value={WorkoutCategory.LEGS}>Legs</MenuItem>
                    <MenuItem key={WorkoutCategory.PUSH} value={WorkoutCategory.PUSH}>Push</MenuItem>
                    <MenuItem key={WorkoutCategory.PULL} value={WorkoutCategory.PULL}>Pull</MenuItem>
                    <MenuItem key={WorkoutCategory.UPPER} value={WorkoutCategory.UPPER}>Upper</MenuItem>
                    <MenuItem key={WorkoutCategory.LOWER} value={WorkoutCategory.LOWER}>Lower</MenuItem>
                    <MenuItem key={WorkoutCategory.FULL_BODY} value={WorkoutCategory.FULL_BODY}>Full Body</MenuItem>
                    <MenuItem key={WorkoutCategory.HIIT} value={WorkoutCategory.HIIT}>HIIT</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <Typography variant='h6'>
                      Exercises:
                    </Typography>
                    <Button onClick={() => setOpenExerciseModal(true)}>
                      Add Exercises
                    </Button>
                  </Box>
                  <List>
                    {formik.values.exercises.map((exercise) => (
                      <Box key={exercise.id}>
                        <ListItem
                          secondaryAction={
                            <IconButton edge='end' onClick={() => handleRemoveExercise(exercise.id)}>
                              <Delete />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={readExerciseById(exercise.id).title}
                            secondary={parseExerciseCategories(readExerciseById(exercise.id).categories)}
                          />
                        </ListItem>
                        <Divider />
                      </Box>
                    ))}
                  </List>
                </Grid>
              </Grid>

              <Button variant='contained' type='submit' sx={{ marginBottom: 2, marginTop: 2 }}>
                Save
              </Button>
            </Box>
          </FormControl>
        </Box>

        {openExerciseModal &&
          <ExerciseModal
            currentExercises={formik.values.exercises}
            handleAddExercise={handleAddExercise}
            category={formik.values.category}
            handleClose={() => setOpenExerciseModal(false)}
          />
        }
        {openConfirmationModal && confirmationCategory &&
          <ConfirmationModal
            handleChangeCategory={() => handleChangeCategory()}
            handleClose={() => handleCloseConfirmationModal()}
          />
        }
      </Container>
    </ThemeProvider>
  );
}

export default WorkoutFormCreate;